import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Tournoi} from '../../models/tournoi.model';
import {Joueur} from '../../models/joueur.model';
import {Match} from '../../models/match.model';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-switchpairings',
  templateUrl: './switchpairings.component.html',
  styleUrls: ['./switchpairings.component.scss']
})
export class SwitchpairingsComponent implements OnInit {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  formSearchForTable: FormGroup ;
  tableInput: FormGroup ;

  playerstoPair: Joueur[] ;
  droppedPlayers: Joueur[] ;
  selectedPlayer1: Joueur ;
  selectedPlayer2: Joueur ;

  started: boolean ;

  constructor(private route: ActivatedRoute,
              private authService: AuthService,
              private tournoiService: TournoiService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit(): void {

    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.droppedPlayers = this.getDroppedPlayers() ;
        this.started = this.roundStarted() ;
      }) ;

    this.initForm() ;
    this.playerstoPair = [] ;
    this.selectedPlayer1 = null ;
    this.selectedPlayer2 = null ;
  }

  onBackToRound(){
    if (this.tournoi.step === 'rounds')
    { this.router.navigate(['gererronde', this.currentTournamentIndex]); }
    else
    { this.router.navigate(['finalmatches', this.currentTournamentIndex]); }
  }

  onMakePairingsManyaly(){
    this.getPlayersToPair() ;
    this.tournoi.currentMatches.splice(0, 1) ;
  }

  initForm(){
    this.formSearchForTable = this.formBuilder.group({
      research: ['', Validators.required]
    }) ;

    this.tableInput = this.formBuilder.group({
      tableNumber: ['', Validators.required]
    }) ;
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
          || this.tournoi.currentMatches[table].joueur2.lastName.toLowerCase().search(research.toLowerCase()) !== -1;
      }
    }
  }

  checkIfTableIsAlreadyTaken(){
    let alreadyTaken = false ;
    const tNumber = this.tableInput.get('tableNumber').value ;

    for (let i = 0 ; i < this.tournoi.currentMatches.length ; i++)
    {
      if (this.tournoi.currentMatches[i].table === tNumber)
      { alreadyTaken = true ; }
    }
    return alreadyTaken ;
  }

  selectPlayer(toPairId: number){

    if (this.selectedPlayer1 === null)
    {
      this.selectedPlayer1 = this.playerstoPair[toPairId] ;
      this.playerstoPair.splice(toPairId, 1) ;
    }
    else
    {
      if (this.playerstoPair[toPairId].playerID !== this.selectedPlayer1.playerID && !this.selectedPlayer2)
      {
        this.selectedPlayer2 = this.playerstoPair[toPairId] ;
        this.playerstoPair.splice(toPairId, 1) ;
        this.tableInput.controls['tableNumber'].setValue(this.getFirstAvalaibleTable()) ;
      }
    }
  }

  giveBye(){
    this.selectedPlayer2 = new Joueur('bye', '***', '15000') ;
    this.tableInput.controls['tableNumber'].setValue(this.getMaxTable() + 1) ;
  }

  cancelMatchCreation(){

    if (this.selectedPlayer1 !== null)
    { this.playerstoPair.push(this.selectedPlayer1) ; }

    if (this.selectedPlayer2 !== null && this.selectedPlayer2.playerID !== '15000')
    { this.playerstoPair.push(this.selectedPlayer2) ; }

    this.selectedPlayer1 = null ;
    this.selectedPlayer2 = null ;

    this.tableInput.reset() ;
  }

  matchIsComplete(){
    if (this.selectedPlayer1 !== null && this.selectedPlayer2 !== null)
    { return true ; }
    else
    { return false ; }
  }

  checkIfPlayersAlreadyFaced(j1: Joueur, j2: Joueur){
    let alreadyFaced = false ;

    if (j1 !== null && j2 !== null)
    {
      for (let i = 0 ; i < j1.previousOpponents.length ; i++)
      {
        if (j1.previousOpponents[i] !== 15000)
        {
          if (j1.previousOpponents[i] === j2.playerIndexInEvent)
          { alreadyFaced = true ; }
        }
      }
    }
    return alreadyFaced ;
  }

  createMatch(){
    const newMatch = new Match(this.selectedPlayer1, this.selectedPlayer2) ;
    let table = this.tableInput.get('tableNumber').value ;

    if (table < 1)
    { table = this.getFirstAvalaibleTable() ; }

    newMatch.table = table ;
    if (newMatch.joueur2.playerID === '15000')
    {
      newMatch.scoreAlreadySubmitted = true ;
      newMatch.scoreJ1 = 2 ;
      newMatch.scoreJ2 = 0 ;
    }
    this.tournoi.currentMatches.splice(newMatch.table - 1, 0, newMatch) ;
    this.selectedPlayer1 = null ;
    this.selectedPlayer2 = null ;
    this.tableInput.reset() ;
  }

  removeMatch(matchId: number, j1: Joueur, j2: Joueur){
    this.tournoi.currentMatches.splice(matchId, 1) ;
    this.playerstoPair.push(j1) ;
    if (j2.playerID !== '15000')
    { this.playerstoPair.push(j2) ; }
  }

  validateMatches(){
  this.tournoiService.setCurrentMatches(this.tournoi.tournamentName, this.tournoi.currentMatches) ;
  this.tournoi.rondes[this.tournoi.rondeEnCours - 1].firstPairingsAlreadySubmitted = true ;
  this.onBackToRound() ;
  }

  getMaxTable(){
    let max = 0 ;

    for (let i = 0 ; i < this.tournoi.currentMatches.length ; i++)
    {
      if (this.tournoi.currentMatches[i].table > max)
      { max = this.tournoi.currentMatches[i].table ; }
    }
    return max ;
  }

  getFirstAvalaibleTable(){
    let table: number ;

    if (this.tournoi.currentMatches.length > 0)
    {
      if (this.tournoi.currentMatches[0].table === 2) { table = 1 ; }
      else
      {
        for (let i = 0 ; i < this.tournoi.currentMatches.length - 1 ; i++)
        {
          if (this.tournoi.currentMatches[i].table + 1 !== this.tournoi.currentMatches[i + 1].table)
          {
            table =  this.tournoi.currentMatches[i].table + 1 ;
            i = this.tournoi.currentMatches.length ;
          }
          else if (i === this.tournoi.currentMatches.length - 2)
          { table = this.getMaxTable() + 1 ; }
        }
      }
    }
    else { table = 1 ; }

    return table ;
  }

  onResetMatches(){
    this.tournoiService.resetPairings(this.tournoi.tournamentName) ;
    this.onBackToRound() ;
  }

  getDroppedPlayers(){
    const dropped: Joueur[] = [] ;
    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      if (this.tournoi.registeredPlayers[i].status === 'dropped')
      { dropped.push(this.tournoi.registeredPlayers[i]) ; }
    }

    return dropped ;
  }

  findPlayerInaMatch(pId: string){
    let found = false ;
    for (let i = 0 ; i < this.tournoi.currentMatches.length ; i++)
    {
      if (this.tournoi.currentMatches[i].joueur1.playerID === pId || this.tournoi.currentMatches[i].joueur2.playerID === pId)
      { found = true ; i = this.tournoi.currentMatches.length ; }
    }
    return found ;
  }

  getPlayersToPair(){
    if (this.tournoi.rondes[this.tournoi.rondeEnCours -1].firstPairingsAlreadySubmitted === false)
    {
      for (let i = 0 ; i < this.tournoi.currentStanding.length ; i++)
      {
        if (this.tournoi.currentStanding[i].status === 'active')
        { this.playerstoPair.push(this.tournoi.currentStanding[i]) ; }
      }
    }
  }

  roundStarted(){
    return this.tournoi.rondes[this.tournoi.rondeEnCours -1].firstPairingsAlreadySubmitted ;
  }

  pairingPossible(joueur: Joueur){
    let possible = true ;

    if (this.selectedPlayer1 !== null)
    {
      if (this.checkIfPlayersAlreadyFaced(this.selectedPlayer1, joueur))
      { possible = false ; }
    }

    return possible ;
  }
}
