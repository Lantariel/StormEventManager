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

  desactivateFixedRoundNumber(id: number, nb: number){
    this.tournois[id].roundNumberIsFixed = false ;
    this.tournois[id].nombreDeRondes = nb ;
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
      this.tournois[id].registeredPlayers[i].fixedOnTable = 'none' ;
      this.tournois[id].registeredPlayers[i].playingAt = 'none' ;
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

  setTournamentTop(id: number, nb: number){
    this.tournois[id].tournamentCut = nb ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  setFinalsActivation(tnName: string, activated: boolean){
    const tnId = this.findTournamentIdByName(tnName) ;
    this.tournois[tnId].finalBracket = activated;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  endTournament(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    this.lockFinalStanding(tnId) ;
    this.uploadDecksStats(tnId) ;
    this.tournois[tnId].isLive = false ;
    this.tournois[tnId].isFinished = true ;
  }

  lockFinalStanding(tnId: number){
    let tempWinner: Joueur ;
    let tempLooser: Joueur ;

    if (this.tournois[tnId].currentMatches[0].scoreJ1 > this.tournois[tnId].currentMatches[0].scoreJ2)
    {
      tempWinner = this.tournois[tnId].currentMatches[0].joueur1 ;
      tempLooser = this.tournois[tnId].currentMatches[0].joueur2 ;
    }
    else
    {
      tempWinner = this.tournois[tnId].currentMatches[0].joueur2 ;
      tempLooser = this.tournois[tnId].currentMatches[0].joueur1 ;
    }
    this.tournois[tnId].currentStanding[0] = tempWinner ;
    this.tournois[tnId].currentStanding[1] = tempLooser ;
  }

  uploadDecksStats(tnId: number){
  console.log('upload des decks') ;
  }

  /* == GESTION DES RONDES == */

  goToNexRound(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    const actualRoundNumber = this.tournois[tnId].rondeEnCours ;
    const nouvelleRonde = new Ronde(tnName, actualRoundNumber + 1) ;

    if (actualRoundNumber === this.tournois[tnId].nombreDeRondes)
    {
      this.tournois[tnId].step = 'finals' ;
      this.lockFinalPlayers(tnName) ;
    }

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
          let nextMatch = alreadyPlayed[i] + 1 ;
          let paired = false ;

          while (!paired)
          {
            if (!this.checkIfPlayersalreadyFaced(this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur1, this.tournois[tnId].currentMatches[nextMatch].joueur1))
            {
              if (!this.checkIfPlayersalreadyFaced(this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur2, this.tournois[tnId].currentMatches[nextMatch].joueur2))
              {
                const tempPlayer = this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur2 ;
                this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur2 = this.tournois[tnId].currentMatches[nextMatch].joueur1 ;
                this.tournois[tnId].currentMatches[nextMatch].joueur1 = tempPlayer ;
                paired = true ;
              }
              else if (!this.checkIfPlayersalreadyFaced(this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur1, this.tournois[tnId].currentMatches[nextMatch].joueur2))
              {
                if (!this.checkIfPlayersalreadyFaced(this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur2, this.tournois[tnId].currentMatches[nextMatch].joueur1))
                {
                  const tempPlayer = this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur2 ;
                  this.tournois[tnId].currentMatches[alreadyPlayed[i]].joueur2 = this.tournois[tnId].currentMatches[nextMatch].joueur2 ;
                  this.tournois[tnId].currentMatches[nextMatch].joueur2 = tempPlayer ;
                  paired = true ;
                }
                else
                { nextMatch++ ; }
              }
            }
          }
        }
      }
    }

    this.checkByes(tnId) ;
    this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].firstPairingsAlreadySubmitted = true ;

    this.checkFixedTables(tnId) ;

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  swapPlayersBetweenMatches(tnId: number, match1: number, match2: number){
    const tempPlayer = this.tournois[tnId].currentMatches[match1].joueur1 ;
    this.tournois[tnId].currentMatches[match1].joueur1 = this.tournois[tnId].currentMatches[match2].joueur1 ;
    this.tournois[tnId].currentMatches[match2].joueur1 = tempPlayer ;
  }

  swapPlayer2BetweenMatches(tnId: number, match1: number, match2: number){
    const tempPlayer = this.tournois[tnId].currentMatches[match1].joueur2 ;
    this.tournois[tnId].currentMatches[match1].joueur2 = this.tournois[tnId].currentMatches[match2].joueur2 ;
    this.tournois[tnId].currentMatches[match2].joueur2 = tempPlayer ;
  }

  createMatchesFromArray(tabJoueurs: Joueur[], tnId: number){
    const half = tabJoueurs.length / 2 ;
    const matches: Match[] = [] ;
    const maxTable = this.tournois[tnId].currentMatches.length ;

    for (let i = 0 ; i < tabJoueurs.length / 2 ; i++)
    { matches.push(new Match(tabJoueurs[i], tabJoueurs[i + half])) ; }

    for (let y = 0 ; y < matches.length ; y++)
    {
      matches[y].table = maxTable + y ;

      if (matches[y].joueur2.playerID !== '15000')
      {
        this.tournois[tnId].registeredPlayers[matches[y].joueur1.playerIndexInEvent].playingAt = matches[y].table.toString() ;
        this.tournois[tnId].registeredPlayers[matches[y].joueur2.playerIndexInEvent].playingAt = matches[y].table.toString() ;
      }
      else
      { this.tournois[tnId].registeredPlayers[matches[y].joueur1.playerIndexInEvent].playingAt = '***bye***' ; }
      this.tournois[tnId].currentMatches.push(matches[y]) ;
    }
  }

  createMatch(tnId: number, j1: Joueur, j2: Joueur){
    this.tournois[tnId].currentMatches.push(new Match(j1, j2)) ;
  }

  clearMatches(tnId: number){
   this.tournois[tnId].currentMatches.splice(0, this.tournois[tnId].currentMatches.length) ;
   this.tournois[tnId].currentMatches.push(new Match(this.createBye(), this.createBye())) ;
   this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].firstPairingsAlreadySubmitted = false ;
  }

  resetPairings(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    this.clearMatches(tnId) ;
    this.saveTournoi() ;
    this.emitTournois() ;
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
    console.log(alreadyPlayed) ;
    return alreadyPlayed ; // Retourne les tables où un match a déjà été joué
  }

  swapMatches(tnName: string, match1Id: number, match2Id: number){
    const tnId = this.findTournamentIdByName(tnName) ;
    const tempMatch = this.tournois[tnId].currentMatches[match1Id] ;
    this.tournois[tnId].currentMatches[match1Id] = this.tournois[tnId].currentMatches[match2Id] ;
    this.tournois[tnId].currentMatches[match2Id] = tempMatch ;
  }

  checkFixedTables(tnId: number){

    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    {
      if (this.tournois[tnId].currentMatches[i].joueur2.playerID !== '15000')
      {
        if (this.tournois[tnId].currentMatches[i].joueur1.fixedOnTable !== 'none')
        {
          this.swapPlayersBetweenMatches(tnId, i, +this.tournois[tnId].currentMatches[i].joueur1.fixedOnTable - 1) ;
          this.swapPlayer2BetweenMatches(tnId, i, +this.tournois[tnId].currentMatches[i].joueur1.fixedOnTable - 1) ;
        }

        else if (this.tournois[tnId].currentMatches[i].joueur2.fixedOnTable !== 'none')
        {
          this.swapPlayersBetweenMatches(tnId, i, +this.tournois[tnId].currentMatches[i].joueur2.fixedOnTable - 1) ;
          this.swapPlayer2BetweenMatches(tnId, i, +this.tournois[tnId].currentMatches[i].joueur2.fixedOnTable - 1) ;
        }
      }
    }
  }

  setCurrentMatches(tnName: string, matches: Match[]){
    const tnId = this.findTournamentIdByName(tnName) ;
    this.tournois[tnId].currentMatches = matches;
    this.saveTournoi() ;
    this.emitTournois();
  }

  checkIfPlayersalreadyFaced(j1: Joueur, j2: Joueur){
    let alreadyFaced = false ;

    for (let i = 0 ; i < j1.previousOpponents.length ; i++)
    {
      if (j1.previousOpponents[i] === j2.playerIndexInEvent)
      { alreadyFaced = true ; }
    }
    return alreadyFaced ;
  }

  createFinalMatches(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    const players: Joueur[] = [] ;

    for (let i = 0 ; i < this.tournois[tnId].currentStanding.length ; i++)
    {
      if (this.tournois[tnId].currentStanding[i].status === 'active')
      { players.push(this.tournois[tnId].currentStanding[i]) ; }
    }

    const half = players.length / 2 - 1 ;
    const matches: Match[] = [];

    for (let i = 0 ; i <= half ; i++)
    {
      matches.push(new Match(players[i], players[players.length - 1 - i])) ;
      matches[i].table = i + 1 ;
    }

    this.tournois[tnId].currentMatches = matches ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  nextFinalStep(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    const tempWinners: Joueur[] = [] ;
    let tempLoosers: Joueur[] = [] ;
    const tempMatches: Match[] = [] ;
    const tempTop: Joueur[] = [] ;

    // lock des résultats
    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    {
      const idJ1 = this.tournois[tnId].currentMatches[i].joueur1.playerIndexInEvent ;
      const idJ2 = this.tournois[tnId].currentMatches[i].joueur2.playerIndexInEvent ;
      const totalGames = this.tournois[tnId].currentMatches[i].scoreJ1 + this.tournois[tnId].currentMatches[i].scoreJ2 ;

      this.tournois[tnId].registeredPlayers[idJ1].matchsPlayed++ ;
      this.tournois[tnId].registeredPlayers[idJ2].matchsPlayed++ ;
      this.tournois[tnId].registeredPlayers[idJ1].gamesPlayed += totalGames ;
      this.tournois[tnId].registeredPlayers[idJ2].gamesPlayed += totalGames ;
      this.tournois[tnId].registeredPlayers[idJ1].gameWins += this.tournois[tnId].currentMatches[i].scoreJ1 ;
      this.tournois[tnId].registeredPlayers[idJ2].gameWins += this.tournois[tnId].currentMatches[i].scoreJ2 ;
      this.tournois[tnId].registeredPlayers[idJ1].previousOpponents.push(idJ2) ;
      this.tournois[tnId].registeredPlayers[idJ2].previousOpponents.push(idJ1) ;

      if (this.tournois[tnId].currentMatches[i].scoreJ1 > this.tournois[tnId].currentMatches[i].scoreJ2)
      {
        this.tournois[tnId].registeredPlayers[idJ2].status = 'dropped' ;
        this.tournois[tnId].registeredPlayers[idJ1].matchWins++ ;
        this.tournois[tnId].registeredPlayers[idJ1].score += 3 ;
        tempWinners.push(this.tournois[tnId].registeredPlayers[idJ1]) ;
        tempLoosers.push(this.tournois[tnId].registeredPlayers[idJ2]) ;
      }
      else
      {
        this.tournois[tnId].registeredPlayers[idJ1].status = 'dropped' ;
        this.tournois[tnId].registeredPlayers[idJ2].matchWins++ ;
        this.tournois[tnId].registeredPlayers[idJ2].matchWins += 3 ;
        tempWinners.push(this.tournois[tnId].registeredPlayers[idJ2]) ;
        tempLoosers.push(this.tournois[tnId].registeredPlayers[idJ1]) ;
      }
    }

    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    { this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].matches.push(this.tournois[tnId].currentMatches[i]) ; }
    this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].matches.splice(0, 1) ;
    this.clearMatches(tnId) ;

    // Passage à la phase suivante
    const actualRoundNumber = this.tournois[tnId].rondeEnCours ;
    const nouvelleRonde = new Ronde(tnName, actualRoundNumber + 1) ;
    this.addNewRound(tnId, nouvelleRonde) ;

    for (let i = 0 ; i < tempWinners.length ; i++)
    {
      tempMatches.push(new Match(tempWinners[i], tempWinners[i + 1])) ;
      i++ ;
    }

    tempLoosers = tempLoosers.sort(function(a, b){
      return a.opponentsGameWinRate - b.opponentsGameWinRate ;
    }) ;

    tempLoosers = tempLoosers.sort(function(a, b){
      return a.personnalGameWinRate - b.personnalGameWinRate ;
    }) ;

    tempLoosers = tempLoosers.sort(function(a, b){
      return a.opponentsMatchWinRate - b.opponentsMatchWinRate ;
    }) ;

    tempLoosers = tempLoosers.sort(function(a, b){
      return a.score - b.score ;
    }) ;

    this.tournois[tnId].currentMatches = tempMatches ;

    for (let i = 0 ; i < tempWinners.length ; i++)
    { tempTop.push(tempWinners[i]) ; }

    for (let i = 0 ; i < tempLoosers.length ; i++)
    { tempTop.push(tempLoosers[i]) ; }

    for (let i = 0 ; i < tempTop.length ; i++)
    { this.tournois[tnId].currentStanding[i] = tempTop[i] ; }

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
        this.tournois[tnId].registeredPlayers[i].previousOpponents.push(15000) ;
      }
    }

    for (let i = 0 ; i < this.tournois[tnId].currentMatches.length ; i++)
    { this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].matches.push(this.tournois[tnId].currentMatches[i]) ; }
    this.tournois[tnId].rondes[this.tournois[tnId].rondeEnCours - 1].matches.splice(0, 1) ;
    this.clearMatches(tnId) ;
  }

  updateWinRates(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    let totalGamesPlayed: number ;
    let totalGamesWon: number ;
    let totalMatchPlayed: number ;
    let totalMatchWon: number ;
    let targetId: number ;

    this.updatePersonnalWinrates(tnId) ;
    // calcul des winrate des adversaires
    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    {
      totalGamesPlayed = 0 ;
      totalGamesWon = 0 ;
      totalMatchPlayed = 0 ;
      totalMatchWon = 0 ;

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
          const played = this.tournois[tnId].rondeEnCours * 2 - 2 ;
          totalGamesPlayed += played ;
          totalGamesWon += played - 2 ;
          totalMatchPlayed += this.tournois[tnId].rondeEnCours - 1 ;
          totalMatchWon += this.tournois[tnId].rondeEnCours - 2 ;
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

  updateStandingFromScratch(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;

    let joueursAClasser: Joueur[] = [] ;

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

    this.tournois[tnId].currentStanding.splice(0, this.tournois[tnId].currentStanding.length) ;
    for (let i = joueursAClasser.length - 1 ; i >= 0 ; i--)
    { this.tournois[tnId].currentStanding.push(joueursAClasser[i]) ; }

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  updatePlayerStatsFromScratch(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    const players: Joueur[] = [];

    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    {
      players.push(this.tournois[tnId].registeredPlayers[i]) ;
      players[i].gamesPlayed = 0 ;
      players[i].score = 0 ;
      players[i].opponentsGameWinRate = 0 ;
      players[i].opponentsMatchWinRate = 0 ;
      players[i].personnalGameWinRate = 0 ;
      players[i].gameWins = 0 ;
      players[i].matchWins = 0 ;
      players[i].matchsPlayed = 0 ;
    }

    for (let i = 0 ; i < this.tournois[tnId].rondes.length - 1 ; i++)
    {
      for (let y = 0 ; y < this.tournois[tnId].rondes[i].matches.length ; y++)
      {
        if (this.tournois[tnId].rondes[i].matches[y].scoreJ2 > this.tournois[tnId].rondes[i].matches[y].scoreJ1)
        {
          const idj1 = this.getPlayerIdInArray(this.tournois[tnId].rondes[i].matches[y].joueur1.playerID, players) ;
          const idj2 = this.getPlayerIdInArray(this.tournois[tnId].rondes[i].matches[y].joueur2.playerID, players) ;
          const totalGamesPlayed = this.tournois[tnId].rondes[i].matches[y].scoreJ1 + this.tournois[tnId].rondes[i].matches[y].scoreJ2 ;

          players[idj2].matchWins++ ;
          players[idj1].matchsPlayed++ ;
          players[idj2].matchsPlayed++ ;
          players[idj2].score += 3 ;
          players[idj2].gameWins += this.tournois[tnId].rondes[i].matches[y].scoreJ2 ;
          players[idj1].gameWins += this.tournois[tnId].rondes[i].matches[y].scoreJ1 ;
          players[idj1].gamesPlayed += totalGamesPlayed ;
          players[idj2].gamesPlayed += totalGamesPlayed ;
        }
        else if (this.tournois[tnId].rondes[i].matches[y].scoreJ2 < this.tournois[tnId].rondes[i].matches[y].scoreJ1)
        {
          const idj1 = this.getPlayerIdInArray(this.tournois[tnId].rondes[i].matches[y].joueur1.playerID, players) ;
          const totalGamesPlayed = this.tournois[tnId].rondes[i].matches[y].scoreJ1 + this.tournois[tnId].rondes[i].matches[y].scoreJ2 ;

          players[idj1].matchWins++ ;
          players[idj1].matchsPlayed++ ;
          players[idj1].score += 3 ;
          players[idj1].gameWins += this.tournois[tnId].rondes[i].matches[y].scoreJ1 ;
          players[idj1].gamesPlayed += totalGamesPlayed ;

          if (this.tournois[tnId].rondes[i].matches[y].joueur2.playerID !== '15000')
          {
            const idj2 = this.getPlayerIdInArray(this.tournois[tnId].rondes[i].matches[y].joueur2.playerID, players) ;
            players[idj2].gameWins += this.tournois[tnId].rondes[i].matches[y].scoreJ2 ;
            players[idj2].gamesPlayed += totalGamesPlayed ;
            players[idj2].matchsPlayed++ ;
          }
        }
        else if (this.tournois[tnId].rondes[i].matches[y].scoreJ2 === this.tournois[tnId].rondes[i].matches[y].scoreJ1)
        {
          const idj1 = this.getPlayerIdInArray(this.tournois[tnId].rondes[i].matches[y].joueur1.playerID, players) ;
          const idj2 = this.getPlayerIdInArray(this.tournois[tnId].rondes[i].matches[y].joueur2.playerID, players) ;
          const totalGamesPlayed = this.tournois[tnId].rondes[i].matches[y].scoreJ1 + this.tournois[tnId].rondes[i].matches[y].scoreJ2 ;

          players[idj1].score += 1 ;
          players[idj2].score += 1 ;
          players[idj1].matchsPlayed++ ;
          players[idj2].matchsPlayed++ ;
          players[idj2].gameWins += this.tournois[tnId].rondes[i].matches[y].scoreJ2 ;
          players[idj1].gameWins += this.tournois[tnId].rondes[i].matches[y].scoreJ1 ;
          players[idj1].gamesPlayed += totalGamesPlayed ;
          players[idj2].gamesPlayed += totalGamesPlayed ;
        }
      }
    }

    console.log(players) ;
    this.tournois[tnId].registeredPlayers.splice(0, this.tournois[tnId].registeredPlayers.length) ;
    this.tournois[tnId].registeredPlayers = players ;
    console.log('== APRES COPIE PLAYERS ==') ;
    console.log(this.tournois[tnId].registeredPlayers) ;
    this.updateWinRates(tnName) ;
    this.updateStandingFromScratch(tnName) ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  updateWinratesFromScratch(tnId: number){
    this.updatePersonnalWinrates(tnId) ;
    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    {
      for (let y = 0 ; y < this.tournois[tnId].registeredPlayers[i].previousOpponents.length ; y++)
      {

      }
    }
  }

  updatePersonnalWinrates(tnId: number){
    for (let i = 0 ; i < this.tournois[tnId].registeredPlayers.length ; i++)
    {
      this.tournois[tnId].registeredPlayers[i].personnalGameWinRate = this.tournois[tnId].registeredPlayers[i].gameWins / this.tournois[tnId].registeredPlayers[i].gamesPlayed  ;
      this.tournois[tnId].registeredPlayers[i].personnalMatchWinRate = this.tournois[tnId].registeredPlayers[i].matchWins / this.tournois[tnId].registeredPlayers[i].matchsPlayed  ;
    }
  }

  getPlayerIdInArray(pId: string, pArray: Joueur[]){
    let id = 0 ;

    for (let i = 0 ; i < pArray.length ; i++)
    {
      if (pArray[i].playerID === pId)
      {
        id = i ;
        i = pArray.length ;
      }
    }
    return id ;
  }

  modifyPreviousScore(tnName: string, prevRounds: Ronde[]){
    const tnId = this.findTournamentIdByName(tnName) ;

    for (let i = 0 ; i < prevRounds.length ; i++)
    { this.tournois[tnId].rondes[i] = prevRounds[i] ; }

    this.updatePlayerStatsFromScratch(tnName) ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  /* === GESTION DES JOUEURS === */

  dropPlayer(tnName: string, playerId: number) {
    const tnId = this.findTournamentIdByName(tnName) ;
    this.tournois[tnId].registeredPlayers[playerId].status = 'dropped' ;
    this.tournois[tnId].currentStanding[this.findPlayerInStandings(tnId, this.tournois[tnId].registeredPlayers[playerId].playerID)].status = 'dropped' ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  rehabPlayer(tnName: string, playerId: number) {
    const tnId = this.findTournamentIdByName(tnName) ;
    this.tournois[tnId].registeredPlayers[playerId].status = 'active' ;
    this.tournois[tnId].currentStanding[this.findPlayerInStandings(tnId, this.tournois[tnId].registeredPlayers[playerId].playerID)].status = 'active' ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  setFixedTable(tnName: string, playerId: number, table: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    const id = playerId ;

    this.tournois[tnId].registeredPlayers[id].fixedOnTable = table ;
    this.tournois[tnId].currentStanding[this.findPlayerInStandings(tnId, this.tournois[tnId].registeredPlayers[id].playerID)].fixedOnTable = table ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  lockFinalPlayers(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;
    for (let i = 0 ; i <  this.tournois[tnId].currentStanding.length ; i++)
    {
      if (i >= this.tournois[tnId].tournamentCut)
      { this.tournois[tnId].currentStanding[i].status = 'dropped' ; }
    }
    this.saveTournoi() ;
    this.emitTournois() ;
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
      this.tournois[tnId].currentStanding[this.findPlayerInStandings(tnId, this.tournois[tnId].currentMatches[matchID].joueur2.playerID)].warnings.push(penalty) ;
    }
    else
    {
      playerID = this.tournois[tnId].currentMatches[matchID].joueur2.playerIndexInEvent ;
      this.tournois[tnId].currentMatches[matchID].joueur2.warnings.push(penalty) ;
      this.tournois[tnId].currentStanding[this.findPlayerInStandings(tnId, this.tournois[tnId].currentMatches[matchID].joueur2.playerID)].warnings.push(penalty) ;
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

  findPlayerInStandings(tnId: number, pId: string){

    let idToGet: number ;
    for (let i = 0 ; i < this.tournois[tnId].currentStanding.length ; i++)
    {
      if (this.tournois[tnId].currentStanding[i].playerID === pId)
      {
        idToGet = i ;
        i = this.tournois[tnId].currentStanding.length ;
      }
    }
    return idToGet ;
  }

  listeDesJoueursParOrdreAlphabetique(tnName: string){
    const tnId = this.findTournamentIdByName(tnName) ;

    return this.tournois[tnId].registeredPlayers.sort(function(a, b) {
      if (a.lastName < b.lastName)
        return -1 ;
      if (a.lastName > b.lastName)
        return 1;
      return 0 ;
    }) ;

    /*joueursAClasser = joueursAClasser.sort(function(a, b){
      return a.opponentsGameWinRate - b.opponentsGameWinRate ;
    }) ;*/
  }

  updatePlayerName(joueur: Joueur){
    for (let i = 0 ; i < this.tournois.length ; i++)
    {
      for (let y = 0 ; y < this.tournois[i].registeredPlayers.length ; y++)
      {
        if (this.tournois[i].registeredPlayers[y].playerID === joueur.playerID)
        {
          this.tournois[i].registeredPlayers[y].firstName = joueur.firstName ;
          this.tournois[i].registeredPlayers[y].lastName = joueur.lastName ;
          this.tournois[i].registeredPlayers[y].nickname = joueur.nickname ;

          if (this.tournois[i].isLive)
          {
            let pId = this.findPlayerInStandings(i, joueur.playerID) ;
            this.tournois[i].currentStanding[pId].firstName = joueur.firstName ;
            this.tournois[i].currentStanding[pId].lastName = joueur.lastName ;
            this.tournois[i].currentStanding[pId].nickname = joueur.nickname ;
          }
        }
      }
    }
    this.saveTournoi() ;
    this.emitTournois() ;
  }


}
