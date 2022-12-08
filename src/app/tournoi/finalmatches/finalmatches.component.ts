import { Component, OnInit } from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {RondeService} from '../../services/ronde.service';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Match} from '../../models/match.model';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-finalmatches',
  templateUrl: './finalmatches.component.html',
  styleUrls: ['./finalmatches.component.scss']
})
export class FinalmatchesComponent implements OnInit {

  tournoi: Tournoi ;
  currentTournamentIndex: number ;
  matchsEnCours: Match[] ;
  roundNumber: number ;

  formScores: FormGroup ;
  formPenalty: FormGroup ;
  formSearchForTable: FormGroup ;

  displayCreateMatchesButton: boolean ;
  displayPenaltyForm: boolean ;
  tableFocus: number ;
  errorMsg: string ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private authService: AuthService,
              private rondeService: RondeService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit(): void {
    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];
    this.displayCreateMatchesButton = true ;

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.matchsEnCours = this.tournoi?.currentMatches ;

        if (this.matchsEnCours[0].joueur1.playerID !== '15000')
        { this.displayCreateMatchesButton = false ; }

      }) ;

    this.tableFocus = -1 ;
    this.displayPenaltyForm = false ;
    this.errorMsg = null ;

    this.initForm() ;
  }

  initForm(){
    this.formScores = this.formBuilder.group({
      scorej1: ['', Validators.required],
      scorej2: ['', Validators.required]
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
  }

  /* === GESTION DES MATCHS === */

  onCreateMatches(){
  this.tournoiService.createFinalMatches(this.tournoi.tournamentName) ;
  this.matchsEnCours = this.tournoiService.tournois[this.currentTournamentIndex].currentMatches ;
  this.displayCreateMatchesButton = false ;
  this.tournoi.rondes[this.tournoi.rondeEnCours - 1].firstPairingsAlreadySubmitted = true ;
  }

  onSetScore(matchID: number){
    let score1 = this.formScores.get("scorej1").value ;
    let score2 = this.formScores.get("scorej2").value ;

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

    if (score1 !== score2)
    {
      this.matchsEnCours[matchID].scoreJ1 = score1 ;
      this.matchsEnCours[matchID].scoreJ2 = score2 ;
      this.matchsEnCours[matchID].scoreAlreadySubmitted = true ;
      this.tournoiService.enterScore(this.tournoi.tournamentName, matchID, score1, score2, this.tournoi, false, false) ;
    }
    else
    {
      this.errorMsg = 'Les égalités ne sont pas permises en phases finales' ;
    }

    this.formScores.reset() ;
  }

  onSetPenalty(){

  }

  toogleDisplayPenaltyPannel(){
    this.displayPenaltyForm = this.displayPenaltyForm !== true;
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

  setFocusTable(id: number){
    this.tableFocus = id ;
    this.errorMsg = null ;
  }

  onNextStep(){
    this.tableFocus = -1 ;
    this.tournoiService.nextFinalStep(this.tournoi.tournamentName) ;

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.matchsEnCours = this.tournoi?.currentMatches ;

        if (this.matchsEnCours[0].joueur1.playerID !== '15000')
        { this.displayCreateMatchesButton = false ; }
      }) ;
  }

  onEndTournament(){
    this.tournoiService.endTournament(this.tournoi.tournamentName) ;
    this.tournoiService.saveTournoi() ;
    this.tournoiService.emitTournois() ;
  }

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

}
