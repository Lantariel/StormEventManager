import {Component, OnDestroy, OnInit} from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {Subscription} from 'rxjs';
import {Joueur} from '../../models/joueur.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {JoueurService} from '../../services/joueur.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Match} from '../../models/match.model';
import {Ronde} from '../../models/ronde.model';
import {MatchService} from '../../services/match.service';
import {RondeService} from '../../services/ronde.service';

@Component({
  selector: 'app-gerer-rondes',
  templateUrl: './gerer-rondes.component.html',
  styleUrls: ['./gerer-rondes.component.scss']
})

export class GererRondesComponent implements OnInit, OnDestroy {

  tournoi: Tournoi ; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number ; // Index dans la base du tournoi en cours

  classement: Joueur[] = [] ; // Tableau ordonné qui gère le classement

  /* === Récuperation des données des joueurs et des tournois === */

  tournois: Tournoi[] ;
  tournoiSubscription: Subscription ;

  joueurs: Joueur[] ;
  joueurSubscription: Subscription ;

  matches: Match[] ;
  matchSubscription: Subscription ;

  rondes: Ronde[] ;
  rondeSubscription: Subscription ;

  rondeActuelle: Ronde ;

  formScores: FormGroup ;

  tableFocus: number ;
  displayFinishedMatches: boolean ;
  matchesAreOver: boolean ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private joueurService: JoueurService,
              private matchService: MatchService,
              private rondeService: RondeService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit(): void {

    this.tournoi = new Tournoi('', '', +'');
    this.currentTournamentIndex = this.route.snapshot.params['id'] ; // Récupère l'ID du tournoi administré
    this.rondeActuelle = new Ronde('', null) ;

    this.tournoiSubscription = this.tournoiService.tournoisSubject.subscribe(
      (tournois: Tournoi[]) => {
        this.tournois = tournois ;
      }
    );

    this.tournoiService.getTournois() ;
    this.tournoiService.emitTournois() ;

    this.matchSubscription = this.matchService.matchesSubject.subscribe(
      (matches: Match[]) => {
        this.matches = matches ;
      }
    );

    this.matchService.getMatches() ;
    this.matchService.emitMatches() ;

    this.joueurSubscription = this.joueurService.joueursSubject.subscribe(
      (joueurs: Joueur[]) => {
        this.joueurs = joueurs ;
      }
    );

    this.joueurService.getPlayers() ;
    this.joueurService.emitPlayers() ;

    this.rondeSubscription = this.rondeService.rondeSubject.subscribe(
      (rondes: Ronde[]) => {
        this.rondes = rondes ;
      }
    ) ;

    this.rondeService.getRondes() ;
    this.rondeService.emitRondes() ;

    this.initClassement() ;
    this.initForm() ;

    this.tournoi = this.tournois[this.currentTournamentIndex] ;
    this.rondeActuelle = this.rondeService.getRondebyTournamentName(this.tournoi.tournamentName) ;

    this.tableFocus = 0 ;
    this.displayFinishedMatches = false ;
    this.matchesAreOver = this.checkAllMatchesAreOver() ;
  }

  initClassement() {
    this.classement = this.tournoi.currentStanding ;
  }

  initForm() {
    this.formScores = this.formBuilder.group({
      scorej1: ['', Validators.required],
      scorej2: ['', Validators.required]
    }) ;
  }

  /* === GESTION DES RONDES === */

  onNextRound() {
    this.rondeService.forceEndOfRoundForTest(this.tournoi.tournamentName, this.tournoi.registeredPlayers) ;
    this.tournoiService.addNewRound(this.tournoi.tournamentIndex, this.rondeActuelle) ;
    this.rondeService.closeRonde(this.rondeActuelle, this.tournoi.tournamentName, this.tournoi.tournamentId) ;
    this.lancerUneRonde() ;
  }

  lancerUneRonde() {
    this.tournoiService.upRondeEnCours(this.tournoi.tournamentId) ;
    this.tournoi.rondeEnCours++ ;
    const nouvelleRonde = new Ronde(this.tournoi.tournamentName, this.tournoi.rondeEnCours) ;
    this.rondeActuelle = nouvelleRonde ;
    this.rondeService.createRonde(nouvelleRonde) ;
  }

/*  === GESTION DES MATCHS === */

  onStartMatches() {
    this.rondeActuelle.hasStarted = true ;
    this.rondeService.startMatchesInRound(this.tournoi.tournamentName) ;
    this.createPairings() ;
  }

  createPairings() {

    const joueursActifs: Joueur[] = [];
    const joueursRondePrecedente = this.tournoiService.getplayersFromLastRound(this.tournoi.tournamentIndex) ;

    for (let i = 0 ; i < joueursRondePrecedente.length ; i++ )
    {
      if (joueursRondePrecedente[i].status === 'active') // Récupération des joueurs actifs de la ronde précédente
      { joueursActifs.push(joueursRondePrecedente[i]) ; }
    }

    if (joueursActifs.length % 2 !== 0) // Vérification si on a un nombre pair de joueurs actifs, attribution d'un bye si non.
    { joueursActifs.push(new Joueur('bye', '***', 'bye')) ; }

    const tempArray: Joueur[] = [] ;
    let y = 0 ;
    let maxScore = 0 ;
    let index = 0 ;

    while (joueursActifs.length > 0) // Tant qu'on a encore des joueurs à pair
    {
     maxScore = this.getMaxScoreFromArray(joueursActifs) ; // récupère le score maximum

     for (let i = 0 ; i < joueursActifs.length ; i++)
     {
       if (joueursActifs[i].score === maxScore)
       { tempArray.push(joueursActifs[i]) ; index++ ; } // Si score i = score max, on prend le joueur
     }

     if (tempArray.length % 2 !== 0) // Si sous ensemble impair
     {
       tempArray.push(joueursActifs[tempArray.length]) ;
     }

     this.createMatchesFromArray(tempArray) ;
     joueursActifs.splice(0, tempArray.length) ;
     tempArray.splice(0, tempArray.length) ;
     index = 0 ;
    }

    if (this.rondeActuelle.roundNumber === 1) { this.rondeActuelle.currentMatches.splice(0, 1) ; }

    this.rondeService.addMatchesToround(this.tournoi.tournamentName, this.rondeActuelle.currentMatches) ;
  }

  createMatchesFromArray(tabJoueurs: Joueur[]){
  let j1: Joueur ;
  let j2: Joueur ;
  const half = tabJoueurs.length / 2 ;
  for (let i = 0 ; i < tabJoueurs.length / 2 ; i++)
    {
      j1 = tabJoueurs[i] ;
      j2 = tabJoueurs[half + i] ;
      this.rondeActuelle.currentMatches.push(new Match(j1, j2, this.tournoi.tournamentName)) ;

      if (this.rondeActuelle.currentMatches[this.rondeActuelle.currentMatches.length - 1].joueur2.firstName === 'bye')
      {
        this.rondeActuelle.currentMatches[this.rondeActuelle.currentMatches.length - 1].scoreJ1 = 2 ;
        this.rondeActuelle.currentMatches[this.rondeActuelle.currentMatches.length - 1].scoreJ2 = 0 ;
        this.rondeActuelle.currentMatches[this.rondeActuelle.currentMatches.length - 1].scoreAlreadySubmitted = true ;
      }
    }
  }

  appareillerJoueurs(j1: Joueur, j2: Joueur) {

  }

  deletePairing() {

  }

  createBye() {
    const bye = new Joueur('Bye', '***', '000') ;
    return bye ;
  }

  getMaxScoreFromArray(tab: Joueur[]) {
    let maxVal = 0 ;

    for (let i = 0 ; i < tab.length ; i++)
    {
      if (tab[i].score > maxVal)
      { maxVal = tab[i].score ; }
    }
    return maxVal ;
  }

  setFocusTable(id: number) {
    this.tableFocus = id ;
  }

/* === GESTION DES SCORES === */

  onUpdateScore() {
  const scorej1 = this.formScores.get('scorej1').value ;
  const scorej2 = this.formScores.get('scorej2').value ;

  this.enterScores(this.tableFocus, +scorej1, +scorej2) ;
  }

  enterScores (id: number, score1: number, score2: number) {
    this.rondeActuelle.currentMatches[id].scoreJ1 = +score1 ;
    this.rondeActuelle.currentMatches[id].scoreJ2 = +score2 ;
    this.rondeActuelle.currentMatches[id].scoreAlreadySubmitted = true ;
    this.formScores.reset() ;

    this.rondeService.updateScores(this.tournoi.tournamentName, id, +score1, +score2) ;
    this.checkAllMatchesAreOver() ;
  }

  checkAllMatchesAreOver(){

    let isOver = true ;

    if (this.rondeActuelle.currentMatches.length > 0)
    {
      for (let i = 0 ; i < this.rondeActuelle.currentMatches.length ; i++)
      {
        if (this.rondeActuelle.currentMatches[i].scoreAlreadySubmitted === false)
        { isOver = false ; }
      }
      return isOver ;
    }
  }

  lockResultats(){

    let indexj: number ;
    let indexj2: number ;
    let games: number ;

    for (let i = 0 ; i < this.rondeActuelle.currentMatches.length ; i++)
    {
      /* Si score négatif reçu, rammené à 0 */
      if (this.rondeActuelle.currentMatches[i].scoreJ1 < 0)
      { this.rondeActuelle.currentMatches[i].scoreJ1 = 0 ; }

      if (this.rondeActuelle.currentMatches[i].scoreJ2 < 0)
      { this.rondeActuelle.currentMatches[i].scoreJ2 = 0 ; }

      /* Joueur 1 gagne */
      if (this.rondeActuelle.currentMatches[i].scoreJ1 > this.rondeActuelle.currentMatches[i].scoreJ2)
      {
        indexj = this.rondeActuelle.currentMatches[i].joueur1.playerIndexInEvent ;
        indexj2 = this.rondeActuelle.currentMatches[i].joueur2.playerIndexInEvent ;
        games = this.rondeActuelle.currentMatches[i].scoreJ1 + this.rondeActuelle.currentMatches[i].scoreJ2 ;
        this.tournoi.registeredPlayers[indexj].score += 3 ;
        /* Mise à jour des stats pour calcul des winrates */
        /* Adversaires précédents */
        this.tournoi.registeredPlayers[indexj].previousOpponents.push(indexj2) ;
        this.tournoi.registeredPlayers[indexj2].previousOpponents.push(indexj) ;
        /* Matchs et parties joués */
        this.tournoi.registeredPlayers[indexj].matchsPlayed++ ;
        this.tournoi.registeredPlayers[indexj2].matchsPlayed++ ;
        this.tournoi.registeredPlayers[indexj].gamesPlayed += games ;
        this.tournoi.registeredPlayers[indexj2].gamesPlayed += games ;
        /* Matchs et parties gagnés */
        this.tournoi.registeredPlayers[indexj].matchWins += 1 ;
        this.tournoi.registeredPlayers[indexj].gameWins += this.rondeActuelle.currentMatches[i].scoreJ1 ;
        this.tournoi.registeredPlayers[indexj2].gameWins += this.rondeActuelle.currentMatches[i].scoreJ2 ;
      }

      /* Joueur 2 gagne */
      if (this.rondeActuelle.currentMatches[i].scoreJ1 < this.rondeActuelle.currentMatches[i].scoreJ2)
      {
        indexj = this.rondeActuelle.currentMatches[i].joueur2.playerIndexInEvent ;
        indexj2 = this.rondeActuelle.currentMatches[i].joueur2.playerIndexInEvent ;
        games = this.rondeActuelle.currentMatches[i].scoreJ1 + this.rondeActuelle.currentMatches[i].scoreJ2 ;
        this.tournoi.registeredPlayers[indexj].score += 3 ;
        /* Mise à jour des stats pour calcul des winrates */
        /* Adversaires précédents */
        this.tournoi.registeredPlayers[indexj].previousOpponents.push(indexj2) ;
        this.tournoi.registeredPlayers[indexj2].previousOpponents.push(indexj) ;
        /* Matchs et parties joués */
        this.tournoi.registeredPlayers[indexj].matchsPlayed++ ;
        this.tournoi.registeredPlayers[indexj2].matchsPlayed++ ;
        this.tournoi.registeredPlayers[indexj].gamesPlayed += games ;
        this.tournoi.registeredPlayers[indexj2].gamesPlayed += games ;
        /* Matchs et parties gagnés */
        this.tournoi.registeredPlayers[indexj2].matchWins += 1 ;
        this.tournoi.registeredPlayers[indexj].gameWins += this.rondeActuelle.currentMatches[i].scoreJ1 ;
        this.tournoi.registeredPlayers[indexj2].gameWins += this.rondeActuelle.currentMatches[i].scoreJ2 ;
      }

      /* Draw */
      if (this.rondeActuelle.currentMatches[i].scoreJ1 === this.rondeActuelle.currentMatches[i].scoreJ2)
      {
        indexj = this.rondeActuelle.currentMatches[i].joueur1.playerIndexInEvent ;
        indexj2 = this.rondeActuelle.currentMatches[i].joueur2.playerIndexInEvent ;
        games = this.rondeActuelle.currentMatches[i].scoreJ1 + this.rondeActuelle.currentMatches[i].scoreJ2 ;
        this.tournoi.registeredPlayers[indexj].score += 1 ;
        this.tournoi.registeredPlayers[indexj2].score += 1 ;
        /* Mise à jour des stats pour calcul des winrates */
        this.tournoi.registeredPlayers[indexj].previousOpponents.push(indexj2) ;
        this.tournoi.registeredPlayers[indexj2].previousOpponents.push(indexj) ;
        /* Matchs et parties joués */
        this.tournoi.registeredPlayers[indexj].matchsPlayed++ ;
        this.tournoi.registeredPlayers[indexj2].matchsPlayed++ ;
        this.tournoi.registeredPlayers[indexj].gamesPlayed += games ;
        this.tournoi.registeredPlayers[indexj2].gamesPlayed += games ;
        /* Matchs et parties gagnés */
        this.tournoi.registeredPlayers[indexj].gameWins += this.rondeActuelle.currentMatches[i].scoreJ1 ;
        this.tournoi.registeredPlayers[indexj2].gameWins += this.rondeActuelle.currentMatches[i].scoreJ2 ;
      }
    }

    this.updateWinRates() ;
    this.tournoiService.updateRegisteredPlayers(this.tournoi.tournamentId, this.tournoi.registeredPlayers) ;
  }

  updateWinRates(){
    let totalgames = 0 ;
    let totalGameWins = 0 ;
    let totalMatches = 0 ;
    let totalMatchesWins = 0 ;
    let joueur: Joueur ;
    let id: number ;

    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      this.tournoi.registeredPlayers[i].personnalGameWinRate = (this.tournoi.registeredPlayers[i].gameWins / this.tournoi.registeredPlayers[i].gamesPlayed) * 100 ;

      /* Récuperation des stats des adversaires */
      for (let y = 0 ; y < this.tournoi.registeredPlayers[i].previousOpponents.length ; y++)
      {
        id = this.tournoi.registeredPlayers[i].previousOpponents[y] ;
        joueur = this.getPlayerById(id.toString()) ;
        totalgames += joueur.gamesPlayed ;
        totalGameWins += joueur.gameWins ;
        totalMatches += joueur.matchsPlayed ;
        totalMatchesWins += joueur.matchWins ;
      }
      /* Calcul des winrates */
      this.tournoi.registeredPlayers[i].opponentsGameWinRate = (totalGameWins / totalgames) * 100 ;
      this.tournoi.registeredPlayers[i].opponentsMatchWinRate = (totalMatchesWins / totalMatches) * 100 ;
      totalMatches = 0 ;
      totalMatchesWins = 0 ;
      totalgames = 0 ;
      totalGameWins = 0 ;
    }
  }

 /* === === */

  getPlayerById(id: string){
    let joueur: Joueur ;
    if (id !== 'bye')
    {
      for (let x = 0 ; x < this.tournoi.registeredPlayers.length ; x++)
      {
        if (this.tournoi.registeredPlayers[x].playerID === id)
        { return this.tournoi.registeredPlayers[x] ; }
      }
    }
    else
    {
      joueur = new Joueur('bye', '***', 'bye') ;
      joueur.matchWins = 0 ;
      joueur.matchsPlayed = 0 ;
      joueur.gameWins = 0 ;
      joueur.gamesPlayed = 0 ;
      return joueur ;
    }
  }

  toogleDisplayMatches(){
    if (this.displayFinishedMatches === true)
    { this.displayFinishedMatches = false ; }

    else
    { this.displayFinishedMatches = true ; }
  }

  ngOnDestroy() {
    this.tournoiSubscription.unsubscribe() ;
    this.joueurSubscription.unsubscribe() ;
    this.matchSubscription.unsubscribe() ;
  }
}
