import { Component, OnInit } from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {FormBuilder} from '@angular/forms';
import {Joueur} from '../../models/joueur.model';

@Component({
  selector: 'app-afficher-infos-aux-joueurs',
  templateUrl: './afficher-infos-aux-joueurs.component.html',
  styleUrls: ['./afficher-infos-aux-joueurs.component.scss']
})
export class AfficherInfosAuxJoueursComponent implements OnInit {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  triJoueurs: Joueur[] ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private formBuilder: FormBuilder,
              private router: Router) {
  }

  ngOnInit(): void {

    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.triJoueurs = this.tournoiService.listeDesJoueursParOrdreAlphabetique(this.tournoi.tournamentName) ;
      }) ;
  }

  matchResearch(pSearch: number){
    return true ;
  }

  onBackToRound(){
    if (this.tournoi.step === 'rounds')
    { this.router.navigate(['gererronde', this.currentTournamentIndex]); }
    else
    { this.router.navigate(['finalmatches', this.currentTournamentIndex]); }
  }

  onSwitchPairings(){
    this.router.navigate(['switchpairings', this.currentTournamentIndex]);
  }

  onOpenJoueurs(){
    this.router.navigate(['gererjoueurs', this.currentTournamentIndex]);
  }

  getOpponent(player: Joueur){
    let opponent: string = '';

    for (let i = 0 ; i < this.tournoi.currentMatches.length ; i++)
    {
      if (this.tournoi.currentMatches[i].joueur1.playerID === player.playerID)
      {
        if (this.tournoi.currentMatches[i].joueur2.playerID !== '15000')
        {
          opponent = this.tournoi.currentMatches[i].joueur2.firstName + ' ' + this.tournoi.currentMatches[i].joueur2.lastName + ' [' + this.tournoi.currentMatches[i].joueur2.score.toString() + ']';
          i = this.tournoi.currentMatches.length ;
        }
        else
        { opponent = '***bye***' ; }
      }
      else if (this.tournoi.currentMatches[i].joueur2.playerID === player.playerID)
      {
        if (this.tournoi.currentMatches[i].joueur1.playerID !== '15000')
        {
          opponent = this.tournoi.currentMatches[i].joueur1.firstName + ' ' + this.tournoi.currentMatches[i].joueur1.lastName + ' [' + this.tournoi.currentMatches[i].joueur1.score.toString() + ']';
          i = this.tournoi.currentMatches.length ;
        }
        else
        { opponent = '***bye***' ; }
      }
    }
    return opponent ;
  }
}

