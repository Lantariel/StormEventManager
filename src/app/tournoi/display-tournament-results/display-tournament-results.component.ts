import { Component, OnInit } from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Joueur} from '../../models/joueur.model';
import {Match} from '../../models/match.model';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-display-tournament-results',
  templateUrl: './display-tournament-results.component.html',
  styleUrls: ['./display-tournament-results.component.scss']
})
export class DisplayTournamentResultsComponent implements OnInit {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  joueursDuTournoi: Joueur[] ;
  playerFocus: number ;

  chercherJoueur: FormGroup ;

  infoMsg: string ;
  displayInfoMsg: boolean ;
  displayToPlayers: boolean ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private formBuilder: FormBuilder,
              private authService: AuthService,
              private router: Router) { }

  ngOnInit(): void {
    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.joueursDuTournoi = this.tournoi.currentStanding ;
      }) ;

    this.playerFocus = -1 ;

    this.initForm();
  }

  initForm(){
    this.chercherJoueur = this.formBuilder.group({
      search: ['', Validators.required]
    }) ;
  }

  matchResearch(id: number){

    const research = this.chercherJoueur.get('search').value ;

    if (research === '')
    { return true ; }

    else
    {
      return this.joueursDuTournoi[id].firstName.toLowerCase().search(research) !== -1
        || this.joueursDuTournoi[id].lastName.toLowerCase().search(research) !== -1 ;
    }
  }

  onBackToEvents(){
    this.router.navigate(['listetournois']);
  }

  setFocusPlayer(focus: number){
    this.playerFocus = focus ;
  }

  getRealPenalties(pId: number){
    let warnings = 0 ;

    for (let i = 0 ; i < this.joueursDuTournoi[pId].warnings.length ; i++)
    {
      if (this.joueursDuTournoi[pId].warnings[i].penaltyType !== 'none')
      { warnings++ ; }
    }
    return warnings ;
  }

  getPlayerMatchHistory(pFocus: number){
    const idInEvent = this.findPlayerInEvent(pFocus) ;
    const foundMatches: Match[] = [];

    for (let i = 0 ; i < this.tournoi.rondes.length - 1; i++)
    {
      for (let y = 0 ; y < this.tournoi.rondes[i].matches.length ; y++)
      {
        if (this.tournoi.rondes[i].matches[y].joueur1.playerIndexInEvent === idInEvent || this.tournoi.rondes[i].matches[y].joueur2.playerIndexInEvent === idInEvent)
        { foundMatches.push(this.tournoi.rondes[i].matches[y]) ; }
      }
    }
    return foundMatches ;
  }

  getHistory(pFocus: number){
    const idInEvent = this.findPlayerInEvent(pFocus) ;
    const foundMatches: Match[] = [];
    const result: string[] = [] ;
    let playingAt: number ;

    for (let i = 0 ; i < this.tournoi.rondes.length - 1; i++)
    {
      for (let y = 0 ; y < this.tournoi.rondes[i].matches.length ; y++)
      {
        if (this.tournoi.rondes[i].matches[y].joueur1.playerIndexInEvent === idInEvent || this.tournoi.rondes[i].matches[y].joueur2.playerIndexInEvent === idInEvent)
        { foundMatches.push(this.tournoi.rondes[i].matches[y]) ; }
      }
    }

    for (let i = 0 ; i < foundMatches.length ; i++)
    {
      if (foundMatches[i].joueur1.playerID === this.tournoi.registeredPlayers[idInEvent].playerID)
      { playingAt = 1 ; }
      else
      { playingAt = 2 ; }

      if (playingAt === 1 && foundMatches[i].scoreJ1 > foundMatches[i].scoreJ2)
      { result.push('Victoire ' + foundMatches[i].scoreJ1 + ' - ' + foundMatches[i].scoreJ2 + ' contre ' + foundMatches[i].joueur2.firstName + ' ' + foundMatches[i].joueur2.lastName); }
      else if (playingAt === 2 && foundMatches[i].scoreJ2 > foundMatches[i].scoreJ1)
      { result.push('Victoire ' + foundMatches[i].scoreJ2 + ' - ' + foundMatches[i].scoreJ1 + ' contre ' + foundMatches[i].joueur1.firstName + ' ' + foundMatches[i].joueur1.lastName); }
      else if (playingAt === 1 && foundMatches[i].scoreJ2 > foundMatches[i].scoreJ1)
      { result.push('Défaite ' + foundMatches[i].scoreJ1 + ' - ' + foundMatches[i].scoreJ2 + ' contre ' + foundMatches[i].joueur2.firstName + ' ' + foundMatches[i].joueur2.lastName); }
      else if (playingAt === 2 && foundMatches[i].scoreJ2 < foundMatches[i].scoreJ1)
      { result.push('Défaite ' + foundMatches[i].scoreJ2 + ' - ' + foundMatches[i].scoreJ1 + ' contre ' + foundMatches[i].joueur1.firstName + ' ' + foundMatches[i].joueur1.lastName); }
      else if (playingAt === 1 && foundMatches[i].scoreJ2 === foundMatches[i].scoreJ1)
      { result.push('Egalité ' + foundMatches[i].scoreJ1 + ' - ' + foundMatches[i].scoreJ2 + ' contre ' + foundMatches[i].joueur2.firstName + ' ' + foundMatches[i].joueur2.lastName); }
      else if (playingAt === 2 && foundMatches[i].scoreJ2 === foundMatches[i].scoreJ1)
      { result.push('Egalité ' + foundMatches[i].scoreJ2 + ' - ' + foundMatches[i].scoreJ1 + ' contre ' + foundMatches[i].joueur1.firstName + ' ' + foundMatches[i].joueur1.lastName); }
    }
    return result ;
  }

  findPlayerInEvent(pFocus: number){
    let idInEvent: number ;
    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      if (this.tournoi.registeredPlayers[i].playerID === this.joueursDuTournoi[pFocus].playerID)
      {
        idInEvent = i ;
        i = this.tournoi.registeredPlayers.length ;
      }
    }
    return idInEvent ;
  }
}


