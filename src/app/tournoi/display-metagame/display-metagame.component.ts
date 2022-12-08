import {Component, OnInit} from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {TournoiService} from '../../services/tournoi.service';
import {ActivatedRoute, Router} from '@angular/router';
import {DeckInEvent} from '../../models/deckInEvent';
import {Joueur} from '../../models/joueur.model';

@Component({
  selector: 'app-display-metagame',
  templateUrl: './display-metagame.component.html',
  styleUrls: ['./display-metagame.component.scss']
})
export class DisplayMetagameComponent implements OnInit {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  metagame: DeckInEvent[] = [] ;
  deckFocus: number ;
  displaypilots: number[] ;
  deckFocusName: string ;
  deckFocusImg: string ;

  constructor(private tournoiService: TournoiService,
              private route: ActivatedRoute,
              private router: Router
              ) { }

  ngOnInit(): void {
    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.getMetagame() ;
      }) ;

    this.deckFocus = -1 ;
    this.deckFocusName = '' ;
    this.displaypilots = [] ;
  }

  getMetagame(){
    let exists = -1 ;
    let numberOfX = 0 ;
    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      exists = this.checkIfDeckAlreadyExists(this.tournoi.registeredPlayers[i].commander) ;

      if (exists === -1)
      {
        if (this.tournoi.registeredPlayers[i].commander !== 'x')
        {
          this.metagame.push(new DeckInEvent(this.tournoi.registeredPlayers[i].commander, this.tournoi.registeredPlayers[i].commanderImgUrl));
          this.metagame[this.metagame.length - 1].deckImgUrl = this.tournoi.registeredPlayers[i].commanderImgUrl ;
        }
        else
        { numberOfX++ ; }
      }

      else
      { this.metagame[exists].numberOfPlayers++ ; }
    }

    this.metagame = this.sortMetagame(this.metagame) ;

    if (numberOfX > 0)
    {
      this.metagame.push(new DeckInEvent('x', 'x')) ;
      this.metagame[this.metagame.length - 1].numberOfPlayers = numberOfX ;
    }
  }

  checkIfDeckAlreadyExists(deckname: string){
    let alreadyExists = -1 ;
    for (let i = 0 ; i < this.metagame.length ; i++)
    {
      if (this.metagame[i].deckName === deckname)
      {
        alreadyExists = i ;
        i = this.metagame.length ;
      }
    }
    return alreadyExists ;
  }

  sortMetagame(decks: DeckInEvent[]){
    return decks.sort(function(a, b) {
      return b.numberOfPlayers - a.numberOfPlayers;
    }) ;
  }

  getDeckPilots(deck: DeckInEvent){
    const pilots: Joueur[] = [];

    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      if (this.tournoi.registeredPlayers[i].commander === deck.deckName)
      { pilots.push(this.tournoi.registeredPlayers[i]) ; }
    }

    return pilots ;
  }

  onBackToRound(){
    if (this.tournoi.step === 'rounds')
    { this.router.navigate(['gererronde', this.currentTournamentIndex]); }
    else
    { this.router.navigate(['finalmatches', this.currentTournamentIndex]); }
  }

  onSetFocus(nb: number){
    this.deckFocus = nb ;
    this.deckFocusName = this.metagame[nb].deckName ;
    this.deckFocusImg = this.metagame[nb].deckImgUrl ;
  }

  displayPilots(id: number){
    this.displaypilots.push(id) ;
  }

  hidepilots(id: number){
    let place = 0 ;

    for (let i = 0 ; i < this.displaypilots.length ; i++)
    {
      if (id === this.displaypilots[i])
      { place = i ; }
    }
    this.displaypilots.splice(place, 1) ;
  }

  checkDisplayPilot(id: number){
    let display = false ;
    for (let i = 0 ; i < this.displaypilots.length ; i++)
    {
      if (id === this.displaypilots[i])
      { display = true ; }
    }
    return display ;
  }

  getPlayerMatchUps(pId: number){
    if (this.tournoi.rondeEnCours > 1)
    {
      let matchups: string[] = [] ;

      for (let i = 0 ; i < this.tournoi.registeredPlayers[pId].previousOpponents.length ; i++)
      {
        if (this.tournoi.registeredPlayers[pId].previousOpponents[i] !== 15000)
        {
          matchups.push(this.playerWon(+this.tournoi.registeredPlayers[pId].playerID, i + 1) + this.tournoi.registeredPlayers[this.tournoi.registeredPlayers[pId].previousOpponents[i]].commander) ;
        }
        else
        { matchups.push("*** bye ***") ; }
      }
      return matchups ;
    }
    else { return [] ; }
  }

  playerWon(pId: number, roundNumber: number){
    let won: string = '';

    if (roundNumber > 0)
    {
      for (let i = 0 ; i < this.tournoi.rondes[roundNumber - 1].matches.length ; i++)
      {
        if (this.tournoi.rondes[roundNumber - 1].matches[i].joueur1.playerID === pId.toString())
        {
          if (this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 > this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2)
          { won = 'victoire ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 + ' - ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2 + ' contre ' ; }
          // fin if joueur cible gagne
          if (this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 < this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2)
          { won = 'défaite ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 + ' - ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2 + ' contre ' ; }
          // fin if joueur cible perd
          if (this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 === this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2)
          { won = 'égalité ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 + ' - ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2 + ' contre ' ; }
          // fin if joueur cible fait draw
        }
        // === fin if joueur cible = j1 ===
        else if (this.tournoi.rondes[roundNumber - 1].matches[i].joueur2.playerID === pId.toString())
        {
          if (this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 > this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2)
          { won = 'défaite ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2 + ' - ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 + ' contre ' ; }
          // fin if joueur cible perd
          if (this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 < this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2)
          { won = 'victoire ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2 + ' - ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 + ' contre ' ; }
          // fin if joueur cible gagne
          if (this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 === this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2)
          { won = 'égalité ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ1 + ' - ' + this.tournoi.rondes[roundNumber - 1].matches[i].scoreJ2 + ' contre ' ; }
          // fin if joueur cible fait draw
        }
        // === fin if joueur cible = j2 ===
      }
    }
    return won ;
  }
}
