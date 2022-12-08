import {Component, OnDestroy, OnInit} from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {async, Subscription} from 'rxjs';
import {Joueur} from '../../models/joueur.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {JoueurService} from '../../services/joueur.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Ronde} from '../../models/ronde.model';
import {MatchService} from '../../services/match.service';
import {RondeService} from '../../services/ronde.service';
import {Match} from '../../models/match.model';
import {Penalty} from '../../models/penalty.model';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-gerer-rondes',
  templateUrl: './gerer-rondes.component.html',
  styleUrls: ['./gerer-rondes.component.scss']
})

export class GererRondesComponent implements OnInit, OnDestroy {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  /* === Récuperation des données des joueurs et des tournois === */

  formScores: FormGroup;
  formPenalty: FormGroup ;
  formSearchForTable: FormGroup ;
  formAdditionalTime: FormGroup ;
  formDeckCheck: FormGroup ;

  tableFocus: number;
  displayFinishedMatches: boolean;
  displayPenaltyForm: boolean ;
  displayCreateMatchesButton: boolean ;
  displayDeckCheckOptions: boolean ;

  rondeActuelle: Ronde ;
  roundNumber: number ;
  matchsEnCours: Match[] ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private authService: AuthService,
              private rondeService: RondeService,
              private formBuilder: FormBuilder,
              private router: Router) {
  }

  ngOnInit(): void {

    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];
    this.displayCreateMatchesButton = true ;

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.roundNumber = this.tournoi?.rondeEnCours ;
        this.rondeActuelle = this.tournoi?.rondes[this.roundNumber - 1] ;
        this.matchsEnCours = this.tournoi?.currentMatches ;

        if (this.rondeActuelle.firstPairingsAlreadySubmitted === true)
        {
          this.displayCreateMatchesButton = false ;
        }
      }) ;

    this.tableFocus = 0 ;
    this.displayFinishedMatches = false ;
    this.displayPenaltyForm = false ;
    this.displayDeckCheckOptions = false ;

    this.initForm();
  }

  initForm() {
    this.formScores = this.formBuilder.group({
      scorej1: ['', Validators.required],
      scorej2: ['', Validators.required],
      dropj1: [false],
      dropj2: [false]
    });

    this.formPenalty = this.formBuilder.group({
      player: ['', Validators.required],
      type: ['', Validators.required],
      sanction: ['', Validators.required],
      desc: ['', Validators.required],
      judge: ['', Validators.required]
    }) ;

    this.formSearchForTable = this.formBuilder.group({
      research: ['', Validators.required]
    }) ;

    this.formAdditionalTime = this.formBuilder.group({
      timevalue: [0, Validators.required]
    }) ;

    this.formDeckCheck = this.formBuilder.group({
      tableToCheck: ['', Validators.required]
    }) ;
  }

  /* === GESTION DES RONDES === */

  onNextRound() {
    this.tournoi.rondes.push(new Ronde(this.tournoi.tournamentName, this.tournoi.rondeEnCours + 1)) ;
    this.tournoiService.lockMatchResults(this.tournoi.tournamentName) ;
    this.tournoiService.updateWinRates(this.tournoi.tournamentName) ;
    this.tournoiService.calculerClassement(this.tournoi.tournamentName) ;
    this.tournoiService.goToNexRound(this.tournoi.tournamentName) ;

    if (this.roundNumber === this.tournoi.nombreDeRondes)
    {
      this.tournoi.step = 'finals' ;
      this.router.navigate(['finalmatches', this.currentTournamentIndex]) ;
    }

    else
    {
      this.roundNumber++ ;
      this.tournoi.rondeEnCours++ ;
      this.tableFocus = 0 ;
      this.matchsEnCours = this.tournoiService.tournois[this.currentTournamentIndex].currentMatches ;
    }
  }

  onTogleDeckcheck(){
    this.displayDeckCheckOptions = this.displayDeckCheckOptions !== true;
  }

  onGetDeckCheckAtRandom(){
    this.formDeckCheck.get("tableToCheck").setValue(this.tournoiService.getTableToDeckCheck(this.tournoi.tournamentName)) ;
  }

  onDeckCheckSpecificTable(){
    const matchId = this.formDeckCheck.get("tableToCheck").value - 1 ;
    const idJ1 = this.tournoi.currentMatches[matchId].joueur1.playerIndexInEvent ;
    const idJ2 = this.tournoi.currentMatches[matchId].joueur2.playerIndexInEvent ;
    this.tournoiService.setDeckCheckStatus(this.tournoi.tournamentName, [idJ1, idJ2], true) ;
    this.formDeckCheck.reset() ;
  }

  /*  === GESTION DES MATCHS === */

  setFocusTable(id: number) {
    this.tableFocus = id;
    if (this.matchsEnCours[id - 1].scoreAlreadySubmitted === true)
    {
      this.formScores.get("scorej1").setValue(this.matchsEnCours[id - 1].scoreJ1) ;
      this.formScores.get("scorej2").setValue(this.matchsEnCours[id - 1].scoreJ2) ;
    }
    else { this.formScores.reset() ; }
  }

  player1Dropped(id: number){
    return this.matchsEnCours[id].dropj1 ;
  }

  player2Dropped(id: number){
    return this.matchsEnCours[id].dropj2 ;
  }

  onCreateMatches(){

   if (this.tournoi.rondeEnCours === this.tournoi.nombreDeRondes) { this.tournoiService.createLastRoundPairings(this.tournoi.tournamentName) ; }
   else if (this.tournoi.rondeEnCours === 1) { this.tournoiService.createFirstRoundPairings(this.tournoi.tournamentName) ; }
   else { this.tournoiService.createPairingsFromStandingsRecursive(this.tournoi.tournamentName) ; }

   this.matchsEnCours = this.tournoiService.tournois[this.currentTournamentIndex].currentMatches ;
   this.displayCreateMatchesButton = false ;
   this.tournoi.rondes[this.tournoi.rondeEnCours - 1].firstPairingsAlreadySubmitted = true ;
  }

  onSearchTable(){

  }

  matchResearch(table: number){

    const t = table + 1 ;
    const research = this.formSearchForTable.get('research').value ;

    if (research === '')
    { return true ; }

    else
    {
      if (t === +research)
      { return true ; }

      else
      {
        return this.tournoi.currentMatches[table].joueur1.firstName.toLowerCase().search(research.toLowerCase()) !== -1
          || this.tournoi.currentMatches[table].joueur1.lastName.toLowerCase().search(research.toLowerCase()) !== -1
          || this.tournoi.currentMatches[table].joueur2.firstName.toLowerCase().search(research.toLowerCase()) !== -1
          || this.tournoi.currentMatches[table].joueur2.lastName.toLowerCase().search(research.toLowerCase()) !== -1
          || this.tournoi.currentMatches[table].joueur1.nickname.toLowerCase().search(research.toLowerCase()) !== -1
          || this.tournoi.currentMatches[table].joueur2.nickname.toLowerCase().search(research.toLowerCase()) !== -1 ;
      }
    }
  }

  onSetAdditionalTime(id: number){
    const timevalue = this.formAdditionalTime.get("timevalue").value ;
    this.matchsEnCours[id].additionalTime += timevalue ;

    if (this.matchsEnCours[id].additionalTime < 0) { this.matchsEnCours[id].additionalTime = 0 ; }

    this.tournoiService.setAdditionalTime(this.tournoi.tournamentName, id, timevalue) ;
    this.formAdditionalTime.get("timevalue").setValue(0) ;
  }

  hasAdditionalTime(matchId: number){
    let hastime = false ;

    if (this.tournoi.currentMatches[matchId].additionalTime > 0)
    { hastime = true ; }

    return hastime ;
  }

  /* === GESTION DES SCORES === */

  checkAllMatchesAreOver(){
    let allFinished = true ;

    for (let i = 0 ; i < this.matchsEnCours?.length ; i++)
    {
      if (this.matchsEnCours[i].scoreAlreadySubmitted === false)
      {
        allFinished = false ;
        i = this.matchsEnCours.length ;
      }
    }
    return allFinished ;
}

  checkMatchesAlreadyCreated(){
      let alreadyCreated = false ;

      if (this.tournoi?.rondes[this.tournoi.rondeEnCours - 1]?.firstPairingsAlreadySubmitted === true)
      { alreadyCreated = true ; }

      return alreadyCreated ;
    }

  onSetScore(matchID: number){
    let score1 = this.formScores.get("scorej1").value ;
    let score2 = this.formScores.get("scorej2").value ;
    const dropj1 = this.formScores.get("dropj1").value ;
    const dropj2 = this.formScores.get("dropj2").value ;

    if (score1)
    {
      if (score1 < 0)
      { score1 = 0 ; }
    }
    else
    { score1 = 0 ; }

    if (score2)
    {
      if (score2 < 0)
      { score2 = 0 ; }
    }
    else
    { score2 = 0 ; }

    this.matchsEnCours[matchID].scoreJ1 = score1 ;
    this.matchsEnCours[matchID].scoreJ2 = score2 ;
    this.matchsEnCours[matchID].scoreAlreadySubmitted = true ;
    this.matchsEnCours[matchID].dropj1 = dropj1 ;
    this.matchsEnCours[matchID].dropj2 = dropj2 ;

    this.tournoiService.enterScore(this.tournoi.tournamentName, matchID, score1, score2, this.tournoi, dropj1, dropj2) ;
    this.formScores.reset() ;
    this.tableFocus++ ;
}

  /* === GESTION DES PENALITES === */

  onSetPenalty(){
    let choice = this.formPenalty.get('player').value ;
    let pType = this.formPenalty.get('type').value ;
    let pDesc = this.formPenalty.get('desc').value ;
    let sanction = this.formPenalty.get('sanction').value ;
    let judge = this.formPenalty.get('judge').value ;

    this.formPenalty.reset() ;

    if (this.displayPenaltyForm === true)
    { this.displayPenaltyForm = false ; }

    this.tournoiService.addPenalty(this.tournoi.tournamentName, +choice, pType, sanction, pDesc, this.tournoi.rondeEnCours, judge, this.tableFocus - 1) ;

    if (+choice === 1)
    { this.tournoi.currentMatches[this.tableFocus - 1].joueur1.warnings.push(new Penalty(pType, sanction, pDesc, this.roundNumber, judge)) ; }

    else
    { this.tournoi.currentMatches[this.tableFocus - 1].joueur2.warnings.push(new Penalty(pType, sanction, pDesc, this.roundNumber, judge)) ; }

  }

  /* === NAVIGATION === */

  onOpenJoueurs(){
    this.router.navigate(['gererjoueurs', this.currentTournamentIndex]);
  }

  onSwitchPairings(){
    this.router.navigate(['switchpairings', this.currentTournamentIndex]);
  }

  onOpenDisplayInfos(){
    this.router.navigate(['afficherinfos', this.currentTournamentIndex]);
  }

  onPreviousRounds(){
    this.router.navigate(['previousrounds', this.currentTournamentIndex]);
  }

  onDisplayMetagame(){
    this.router.navigate(['displaymetagame', this.currentTournamentIndex]) ;
  }

  /* === ===  */

  toogleDisplayMatches() {
    if (this.displayFinishedMatches === true)
    { this.displayFinishedMatches = false; }
    else
    { this.displayFinishedMatches = true; }
  }

  toogleDisplayPenaltyPannel(){
    if (this.displayPenaltyForm === true)
    { this.displayPenaltyForm = false ; }
    else
    { this.displayPenaltyForm = true ; }
  }

  compareValues(val1: number, val2: number) {
    if (val1 > val2) {
      return true;
    }
    if (val1 < val2) {
      return false;
    }
    if (val1 === val2) {
      return 0;
    }
  }

  compareScore(a: Joueur, b: Joueur) {
    return a.score - b.score;
  }

  getRandom(floor: number, ceiling: number) {
    return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
  }

  playersHasPartner(joueur: Joueur){
    return joueur.partner !== null;
  }

  ngOnDestroy() {

  }
}
