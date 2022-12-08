import { Component, OnInit } from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {Ronde} from '../../models/ronde.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-previous-rounds',
  templateUrl: './previous-rounds.component.html',
  styleUrls: ['./previous-rounds.component.scss']
})
export class PreviousRoundsComponent implements OnInit {

  tournoi: Tournoi ;
  currentTournamentIndex: number ;

  rondes: Ronde[] ;

  roundFocus: number ;
  correctFocus: number ;

  formScores: FormGroup ;

  displayChangesAreValidated: boolean ;

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
        this.rondes = [] ;
        for (let i = 0 ; i < this.tournoi.rondes.length - 1 ; i++)
        { this.rondes.push(this.tournoi.rondes[i]) ; }
      }) ;

    this.roundFocus = -1 ;
    this.correctFocus = -1 ;

    this.displayChangesAreValidated = false ;

    this.initForm() ;
  }

  initForm(){
    this.formScores = this.formBuilder.group({
      scorej1: ['', Validators.required],
      scorej2: ['', Validators.required]
    });
  }

  setRoundFocus(focus: number){
    this.roundFocus = this.rondes[focus].roundNumber ;
  }

  setCorrectFocus(focus: number){
    this.correctFocus = focus ;
  }

  onBackToRound(){
    if (this.tournoi.step === 'rounds')
    { this.router.navigate(['gererronde', this.currentTournamentIndex]); }
    else
    { this.router.navigate(['finalmatches', this.currentTournamentIndex]); }
  }

  onSetScore(roundNb: number, table: number){
    const score1 = this.formScores.get('scorej1').value ;
    const score2 = this.formScores.get('scorej2').value ;
    this.rondes[roundNb].matches[table].scoreJ1 = score1 ;
    this.rondes[roundNb].matches[table].scoreJ2 = score2 ;
    this.formScores.reset() ;
  }

  onValidateChanges(){
    this.tournoiService.modifyPreviousScore(this.tournoi.tournamentName, this.rondes) ;
    this.displayChangesAreValidated = true ;
  }
}
