import { Injectable } from '@angular/core';
import {Tournoi} from '../models/tournoi.model';
import { Match } from '../models/match.model';
import {Subject} from 'rxjs';
import { firebase } from '@firebase/app';
import '@firebase/auth' ;
import '@firebase/database';
import '@firebase/storage' ;
import {Joueur} from '../models/joueur.model';
import {HttpClient} from '@angular/common/http';
import {Ronde} from '../models/ronde.model';
import {max} from 'rxjs/operators';
import {Penalty} from '../models/penalty.model';

@Injectable({
  providedIn: 'root'
})

export class TournoiService {

  tournois: Tournoi[] = [] ;
  tournoisSubject = new Subject<Tournoi[]>() ;

  constructor(private httpClient: HttpClient) { }

  /* === DATABASE === */

  emitTournois() {
    this.tournoisSubject.next(this.tournois) ;
  }

  saveTournoi() {
    this.updateTournamentIds() ;
    firebase.database().ref('/tournois').set(this.tournois) ;
  }

  getTournois() {
    firebase.database().ref('/tournois').on('value', (data) => {
      this.tournois = data.val() ? data.val() : [] ;
      this.emitTournois() ;
    }) ;
  }

  getSingleTournoi(id: number) {
    return new Promise(
      (resolve, reject) => {
        firebase.database().ref('/tournois/' + id).once('value').then(
          (data) => {
            resolve(data.val());
          }, (error) => {
            reject(error) ;
          }
        );
      }
    );
  }

  /* === CREATION D'UN TOURNOI */

  createNewTournoi(newTournoi: Tournoi) {
    newTournoi.tournamentIndex = this.tournois.length ;
    newTournoi.nombreDeRondes = 0 ;
    this.tournois.push(newTournoi) ;
    this.saveTournoi();
    this.emitTournois();
  }

  supprimerTournoi(tournoi: Tournoi){
    const indexTournoiASupprimer = this.tournois.findIndex(
      (tournoiEl) => {
        if (tournoiEl === tournoi) {
          return true ;
        }
      }
    );
    this.tournois.splice(indexTournoiASupprimer, 1);
    this.saveTournoi();
    this.emitTournois();
  }

  ajouterUnJoueur(id: number, joueur: Joueur) {
    this.tournois[id].registeredPlayers.push(joueur) ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  retirerUnJoueur(tournoi: Tournoi, joueur: Joueur) {

    const indexJoueurATrouver = tournoi.registeredPlayers.findIndex(
      (joueurEl: Joueur) => {
        if (joueurEl === joueur) {
          return true ;
        }
      }
    );

    this.tournois[tournoi.tournamentIndex].registeredPlayers = tournoi.registeredPlayers ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  setRoundNumber(id: number , nb: number){

    this.tournois[id].nombreDeRondes = nb ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  activateFixedRoundNumber(id: number){
    this.tournois[id].roundNumberIsFixed = true ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  desactivateFixedRoundNumber(id: number){
    this.tournois[id].roundNumberIsFixed = false ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  beginTournament(id: number){
    this.tournois[id].inscriptionsOuvertes = false ;
    this.tournois[id].rondeEnCours = 1 ;
    this.tournois[id].isLive = true ;
    this.tournois[id].registeredPlayers.splice(0, 1) ;

    for (let i = 0 ; i < this.tournois[id].registeredPlayers.length ; i++) {
      this.tournois[id].registeredPlayers[i].gamesPlayed = 0 ;
      this.tournois[id].registeredPlayers[i].gameWins = 0 ;
      this.tournois[id].registeredPlayers[i].matchsPlayed = 0 ;
      this.tournois[id].registeredPlayers[i].matchWins = 0 ;
      this.tournois[id].registeredPlayers[i].score = 0 ;
      this.tournois[id].registeredPlayers[i].previousOpponents = [15000] ;
      this.tournois[id].registeredPlayers[i].status = 'active' ;
      this.tournois[id].registeredPlayers[i].opponentsGameWinRate = 0 ;
      this.tournois[id].registeredPlayers[i].personnalGameWinRate = 0 ;
      this.tournois[id].registeredPlayers[i].opponentsMatchWinRate = 0 ;
      this.tournois[id].registeredPlayers[i].personnalMatchWinRate = 0 ;
      this.tournois[id].registeredPlayers[i].warnings = [new Penalty('none', 'none', 'No penalty received', 0, 'none')] ;
    }

    this.tournois[id].currentStanding = this.shuffleInPlace(this.tournois[id].registeredPlayers) ;

    for (let i = 0 ; i < this.tournois[id].registeredPlayers.length ; i++) {
      this.tournois[id].registeredPlayers[i].playerIndexInEvent = i ;
    }

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  updateTournamentIds(){
    for (let i = 0 ; i < this.tournois.length ; i++) {
      this.tournois[i].tournamentIndex = i ;
      this.tournois[i].tournamentId = i ;
    }
  }

  /* == GESTION DES RONDES == */

  goToNexRound(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    const actualRoundNumber = this.tournois[tnId].rondeEnCours ;
    const nouvelleRonde = new Ronde(tnName, actualRoundNumber + 1) ;

    if (actualRoundNumber === this.tournois[tnId].nombreDeRondes)
    { this.tournois[tnId].step = 'finals' ; }

    this.addNewRound(tnId, nouvelleRonde) ;

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  addNewRound(id: number, newRound: Ronde){
    this.tournois[id].rondes.push(newRound) ;
    this.tournois[id].rondeEnCours++ ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  updateRegisteredPlayers(tnId: number, joueurs: Joueur[]){
    this.tournois[tnId].registeredPlayers = joueurs ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  /* == GESTION DES MATCHS == */

  createPairingsFromStandings(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    let maxScore = 0 ;
    const standings: Joueur[] = [] ;
    const toPair: Joueur[] = [] ;

    for (let i = 0 ; i < this.tournois[tnId].currentStanding.length ; i++)
    {
      if (this.tournois[tnId].currentStanding[i].status === 'active')
      { standings.push(this.tournois[tnId].currentStanding[i]) ; }
    }

    maxScore = this.getMaxScore(standings) ;

      for (let i = 0 ; i < standings.length ; i++)
      {
        if (standings[i].score === maxScore) // Si le score du joueur i est égal au score maximum
        {
          toPair.push(standings[i]) ;

          if (i === standings.length - 1) // Si on a pairé le dernier joueur
          {
            if (toPair.length % 2 !== 0) // Si nombre de joueurs à matcher impair
            {
              toPair.push(this.createBye()) ; // On ajoute un bye
              this.createMatchesFromArray(toPair, tnId) ;
              toPair.splice(0, toPair.length) ;
            }
            else // Si nombre de joueurs à matcher pair
            {
              this.createMatchesFromArray(toPair, tnId) ;
              toPair.splice(0, toPair.length) ;
            }
          }
        }

        else // si le score du joueur i ne vaut pas le score maximum
        {
          if (toPair.length % 2 !== 0) // Si les joueurs à pairer sont en nombre impair
          {
            toPair.push(standings[i]) ; // On ajoute le joueur i
            this.createMatchesFromArray(toPair, tnId) ;
            toPair.splice(0, toPair.length) ;

            if (i !== standings.length - 1) // Si on est pas à la fin du tableau
            { maxScore = standings[i + 1].score ; }
          }
          else // Si les joueurs à pairer sont en nombre pair
          {
            if (i !== standings.length - 1)
            {
              this.createMatchesFromArray(toPair, tnId) ;
              toPair.splice(0, toPair.length) ;
              toPair.push(standings[i]) ; // On ajoute le joueur i après avoir créé les matchs et vidé toPair
              maxScore = standings[i + 1].score ;
            }
            else // On appareille le dernier joueur
            {
              toPair.push(standings[i]) ;
              toPair.push(this.createBye()) ;
              this.createMatchesFromArray(toPair, tnId) ;
            }
          }
        }
      }

    this.tournois[tnId].currentMatches.splice(0 , 1) ;

    let allPairingsAreNew = false ;

    while (!allPairingsAreNew)
    {
      const  alreadyPlayed = this.checkMatchesAlreadyPlayed(tnId) ;

      if (alreadyPlayed.length < 1)
      { allPairingsAreNew = true ; }

      else
      {
        for (let i = 0 ; i < alreadyPlayed.length ; i++)
        {
          if (alreadyPlayed[i] !== alreadyPlayed.length - 1)
          { this.swapPlayersBetweenMatches(tnId, alreadyPlayed[i], alreadyPlayed[i] + 1) ; }
          else
          { this.swapPlayersBetweenMatches(tnId, alreadyPlayed[i], alreadyPlayed[i] - 1) ; }
        }
      }
    }

    this.checkByes(tnId) ;
    this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].firstPairingsAlreadySubmitted = true ;

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  swapPlayersBetweenMatches(tnId: number, match1: number, match2: number){
    const tempPlayer = this.tournois[tnId].currentMatches[match1].joueur1 ;
    this.tournois[tnId].currentMatches[match1].joueur1 = this.tournois[tnId].currentMatches[match2].joueur1 ;
    this.tournois[tnId].currentMatches[match2].joueur1 = tempPlayer ;
  }

  createMatchesFromArray(tabJoueurs: Joueur[], tnId: number){
    const half = tabJoueurs.length / 2 ;
    const matches: Match[] = [] ;

    for (let i = 0 ; i < tabJoueurs.length / 2 ; i++)
    { matches.push(new Match(tabJoueurs[i], tabJoueurs[i + half])) ; }

    for (let y = 0 ; y < matches.length ; y++)
    { this.tournois[tnId].currentMatches.push(matches[y]) ; }
  }

  createMatch(tnId: number, j1: Joueur, j2: Joueur){
    this.tournois[tnId].currentMatches.push(new Match(j1, j2)) ;
  }

  clearMatches(tnId: number){
   this.tournois[tnId].currentMatches.splice(0, this.tournois[tnId].currentMatches.length) ;
   this.tournois[tnId].currentMatches.push(new Match(this.createBye(), this.createBye())) ;
  }

  createBye(){
    return new Joueur(' bye', '', '15000') ;
  }

  getMaxScore(tabJoueurs: Joueur[]){
    let maxScore = 0 ;

    for (let i = 0 ; i < tabJoueurs.length ; i++)
    {
      if (tabJoueurs[i].score > maxScore)
      { maxScore = tabJoueurs[i].score ; }
    }

    return maxScore ;
  }

  checkByes(tnId: number){

    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    {
      if (this.tournois[tnId].currentMatches[i].joueur2.playerID === '15000')
      {
        this.enterScore(this.tournois[tnId].tournamentName, i, 2, 0) ;
        this.tournois[tnId].currentMatches[i].scoreAlreadySubmitted = true ;
      }
    }
  }

  checkMatchesAlreadyPlayed(tnId: number){

    const alreadyPlayed: number[] = [] ;

    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    {
      for (let y = 0 ; y < this.tournois[tnId].currentMatches[i].joueur1.previousOpponents.length ; y++)
      {
        if (this.tournois[tnId].currentMatches[i].joueur1.previousOpponents[y] === this.tournois[tnId].currentMatches[i].joueur2.playerIndexInEvent)
        { alreadyPlayed.push(i) ; }
      }
    }

    return alreadyPlayed ; // Retourne les tables où un match a déjà été joué
  }

  resetMatches(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;

    this.tournois[tnId].currentMatches.push(new Match(this.createBye(), this.createBye())) ;
    this.tournois[tnId].currentMatches.splice(0, this.tournois[tnId].currentMatches.length - 1) ;
    this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].firstPairingsAlreadySubmitted = false ;

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  /* == GESTION DES SCORES == */

  enterScore(tnName: string, matchId: number, score1: number, score2: number){

    const tnId = this.findTournamentIdByName(tnName) ;

    this.tournois[tnId].currentMatches[matchId].scoreJ1 = score1 ;
    this.tournois[tnId].currentMatches[matchId].scoreJ2 = score2 ;

    if (this.tournois[tnId].currentMatches[matchId].scoreAlreadySubmitted === false)
    { this.tournois[tnId].currentMatches[matchId].scoreAlreadySubmitted = true ; }

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  lockMatchResults(tnName: string){

    const tnId = this.findTournamentIdByName(tnName) ;
    let idJ1: number ;
    let idJ2: number ;
    let score1: number ;
    let score2: number ;
    let totalGames: number ;

    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    {
      idJ1 = this.tournois[tnId].currentMatches[i].joueur1.playerIndexInEvent ;
      idJ2 = this.tournois[tnId].currentMatches[i].joueur2.playerIndexInEvent ;
      score1 = this.tournois[tnId].currentMatches[i].scoreJ1 ;
      score2 = this.tournois[tnId].currentMatches[i].scoreJ2 ;
      totalGames = score1 + score2 ;

      // === VICTOIRE JOUEUR 2 ===
      if (this.tournois[tnId].currentMatches[i].scoreJ1 < this.tournois[tnId].currentMatches[i].scoreJ2)
      {
        // Victoires
        this.tournois[tnId].registeredPlayers[idJ2].score += 3 ;
        this.tournois[tnId].registeredPlayers[idJ2].matchWins++ ;

        // Parties gagnées
        this.tournois[tnId].registeredPlayers[idJ2].gameWins += score2 ;
        this.tournois[tnId].registeredPlayers[idJ1].gameWins += score1 ;

        // Parties et matchs joués
        this.tournois[tnId].registeredPlayers[idJ1].gamesPlayed += totalGames ;
        this.tournois[tnId].registeredPlayers[idJ1].matchsPlayed++ ;

        this.tournois[tnId].registeredPlayers[idJ2].gamesPlayed += totalGames ;
        this.tournois[tnId].registeredPlayers[idJ2].matchsPlayed++ ;

        // update des adversaires précédents
        this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.push(this.tournois[tnId].registeredPlayers[idJ2].playerIndexInEvent) ;
        this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.push(this.tournois[tnId].registeredPlayers[idJ1].playerIndexInEvent) ;

        if (this.tournois[tnId].rondeEnCours === 1)
        {
          this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.splice(0, 1) ;
          this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.splice(0, 1) ;
        }
      }

      // === VICTOIRE JOUEUR 1 ===
      if (this.tournois[tnId].currentMatches[i].scoreJ1 > this.tournois[tnId].currentMatches[i].scoreJ2)
      {
        // Victoires
        this.tournois[tnId].registeredPlayers[idJ1].matchWins++ ;
        this.tournois[tnId].registeredPlayers[idJ1].score += 3 ;

        // Parties gagnées
        this.tournois[tnId].registeredPlayers[idJ1].gameWins += score1 ;

        // Parties et matchés joués
        this.tournois[tnId].registeredPlayers[idJ1].gamesPlayed += totalGames ;
        this.tournois[tnId].registeredPlayers[idJ1].matchsPlayed++ ;

        if (this.tournois[tnId].currentMatches[i].joueur2.playerID.toString() !== '15000') // Si j2 n'est pas un bye
        {
          this.tournois[tnId].registeredPlayers[idJ2].gameWins += score2 ; // Parties gagnées
          this.tournois[tnId].registeredPlayers[idJ2].gamesPlayed += totalGames ; // Parties jouées
          this.tournois[tnId].registeredPlayers[idJ2].matchsPlayed++ ; // Matchs joués
          this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.push(this.tournois[tnId].registeredPlayers[idJ1].playerIndexInEvent) ;
          this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.push(this.tournois[tnId].registeredPlayers[idJ2].playerIndexInEvent) ;

          if (this.tournois[tnId].rondeEnCours === 1)
          {
            this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.splice(0, 1) ;
            this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.splice(0, 1) ;
          }
        }
        else
        {
          this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.push(15000) ;
          if (this.tournois[tnId].rondeEnCours === 1)
          { this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.splice(0, 1) ; }
        }
      }

      // === DRAW ===
      if (this.tournois[tnId].currentMatches[i].scoreJ1 === this.tournois[tnId].currentMatches[i].scoreJ2)
      {
        // update des scores
        this.tournois[tnId].registeredPlayers[idJ1].score += 1 ;
        this.tournois[tnId].registeredPlayers[idJ2].score += 1 ;

        // update des parties gagnées
        this.tournois[tnId].registeredPlayers[idJ1].gameWins += score1 ;
        this.tournois[tnId].registeredPlayers[idJ2].gameWins += score2 ;

        // update des parties jouées
        this.tournois[tnId].registeredPlayers[idJ1].gamesPlayed += totalGames ;
        this.tournois[tnId].registeredPlayers[idJ2].gamesPlayed += totalGames ;
        this.tournois[tnId].registeredPlayers[idJ1].matchsPlayed++ ;
        this.tournois[tnId].registeredPlayers[idJ2].matchsPlayed++ ;

        this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.push(this.tournois[tnId].registeredPlayers[idJ2].playerIndexInEvent) ;
        this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.push(this.tournois[tnId].registeredPlayers[idJ1].playerIndexInEvent) ;

        if (this.tournois[tnId].rondeEnCours === 1)
        {
          this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.splice(0, 1) ;
          this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.splice(0, 1) ;
        }
      }
    }

    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    {
      if (this.tournois[tnId].registeredPlayers[i].status !== 'active')
      {
        this.tournois[tnId].registeredPlayers[i].matchsPlayed++ ;
        this.tournois[tnId].registeredPlayers[i].gamesPlayed += 2 ;
      }
    }

    this.clearMatches(tnId) ;
  }

  updateWinRates(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    let totalGamesPlayed: number ;
    let totalGamesWon: number ;
    let totalMatchPlayed: number ;
    let totalMatchWon: number ;
    let targetId: number ;

    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    {
      totalGamesPlayed = 0 ;
      totalGamesWon = 0 ;
      totalMatchPlayed = 0 ;
      totalMatchWon = 0 ;

      this.tournois[tnId].registeredPlayers[i].personnalGameWinRate = this.tournois[tnId].registeredPlayers[i].gameWins / this.tournois[tnId].registeredPlayers[i].gamesPlayed;
      this.tournois[tnId].registeredPlayers[i].personnalMatchWinRate = this.tournois[tnId].registeredPlayers[i].matchWins / this.tournois[tnId].registeredPlayers[i].matchsPlayed;

      // calcul des winrate des adversaires
      for (let y = 0; y < this.tournois[tnId].registeredPlayers[i].previousOpponents.length ; y++)
      {
        targetId = this.tournois[tnId].registeredPlayers[i].previousOpponents[y] ;

        if (targetId !== 15000) // Si n'est pas un bye
        {
          totalGamesPlayed += this.tournois[tnId].registeredPlayers[targetId].gamesPlayed ;
          totalGamesWon += this.tournois[tnId].registeredPlayers[targetId].gameWins ;
          totalMatchPlayed += this.tournois[tnId].registeredPlayers[targetId].matchsPlayed ;
          totalMatchWon += this.tournois[tnId].registeredPlayers[targetId].matchWins ;
        }
        else
        {
          totalGamesPlayed += this.tournois[tnId].rondeEnCours * 2 ;
          totalGamesWon += this.tournois[tnId].rondeEnCours * 2 - 2 ;
          totalMatchPlayed += this.tournois[tnId].rondeEnCours ;
          totalMatchWon += this.tournois[tnId].rondeEnCours - 1 ;
        }

        this.tournois[tnId].registeredPlayers[i].opponentsGameWinRate = totalGamesWon / totalGamesPlayed ;
        this.tournois[tnId].registeredPlayers[i].opponentsMatchWinRate = totalMatchWon / totalMatchPlayed ;
      }
    }
  }

  calculerClassement(tnName: string){

    const tnId = this.findTournamentIdByName(tnName) ;
    const rondeActuelle = this.tournois[tnId].rondeEnCours ;
    let joueursAClasser: Joueur[] = [];

    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    { joueursAClasser.push(this.tournois[tnId].registeredPlayers[i]) ; }

    joueursAClasser = joueursAClasser.sort(function(a, b){
      return a.opponentsGameWinRate - b.opponentsGameWinRate ;
    }) ;

    joueursAClasser = joueursAClasser.sort(function(a, b){
      return a.personnalGameWinRate - b.personnalGameWinRate ;
    }) ;

    joueursAClasser = joueursAClasser.sort(function(a, b){
      return a.opponentsMatchWinRate - b.opponentsMatchWinRate ;
    }) ;

    joueursAClasser = joueursAClasser.sort(function(a, b){
      return a.score - b.score ;
    }) ;

    for (let i = joueursAClasser.length - 1 ; i >= 0 ; i--)
    { this.tournois[tnId].rondes[rondeActuelle - 1].finalStandings.push(joueursAClasser[i]) ; }

    this.tournois[tnId].rondes[rondeActuelle - 1].finalStandings.splice(0, 1) ;
    this.tournois[tnId].currentStanding = this.tournois[tnId].rondes[rondeActuelle - 1].finalStandings ;
  }

  /* == GESTION DES PENALITES == */

  addPenalty(tnName: string, choice: number, pType: string, pSanction: string, pDesc: string, roundNumber: number, judge: string, matchID: number){
    const tnId = this.findTournamentIdByName(tnName) ;
    const penalty = new Penalty(pType, pSanction, pDesc, roundNumber, judge) ;
    let playerID = 0 ;

    if (choice === 1)
    {
      playerID = this.tournois[tnId].currentMatches[matchID].joueur1.playerIndexInEvent ;
      this.tournois[tnId].currentMatches[matchID].joueur1.warnings.push(penalty) ;
    }
    else
    {
      playerID = this.tournois[tnId].currentMatches[matchID].joueur2.playerIndexInEvent ;
      this.tournois[tnId].currentMatches[matchID].joueur2.warnings.push(penalty) ;
    }

    this.tournois[tnId].registeredPlayers[playerID].warnings.push(penalty) ;

    if (this.tournois[tnId].registeredPlayers[playerID].warnings[0].penaltyType === 'none')
    { this.tournois[tnId].registeredPlayers[playerID].warnings.splice(0, 1) ; }

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  /* == UTILITAIRES == */

  getRandom(floor: number, ceiling: number) {
    return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
  }

  shuffleInPlace(array: Joueur[]) {
    let temp: Joueur ;
    // if it's 1 or 0 items, just return
    if (array.length <= 1) { return array; }

    // For each index in array
    for (let i = 0 ; i < array.length; i++)
    {
      // choose a random not-yet-placed item to place there
      // must be an item AFTER the current item, because the stuff
      // before has all already been placed
      const randomChoiceIndex = this.getRandom(i, array.length - 1);

      // place our random choice in the spot by swapping
      temp = array[i] ;
      array[i] = array[randomChoiceIndex] ;
      array[randomChoiceIndex] = temp ;
    }
    return array;
  }

  findTournamentIdByName(tnName: string) {
    let tnId = 0 ;

    for (let i = 0 ; i < this.tournois.length ; i++)
    {
      if (this.tournois[i].tournamentName === tnName)
      {
        tnId = i ;
        i = this.tournois.length ;
      }
    }

    return tnId ;
  }
}
