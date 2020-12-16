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

  }

  appareillerJoueurs(j1: Joueur, j2: Joueur) {

  }

  createPairings() {

  }

  initClassement() {
    this.classement = this.tournoi.currentStanding ;
  }

  deletePairing() {

  }

  updateScores(matchID: number, score1: number, score2: number) {

  }

  updateClassement() {
    console.log("update du classement") ;
  }

  updateGoalAverages() {
    console.log("update des GA") ;
  }

  initForm() {
    this.formScores = this.formBuilder.group({
      scorej1: ['', Validators.required],
      scorej2: ['', Validators.required]
    }) ;
  }

  onSubmitScore(id: number) {
    const scoreJoueur1 = this.formScores.get('scorej1').value ;
    const scoreJoueur2 = this.formScores.get('scorej2').value ;

    this.updateScores(id, +scoreJoueur1, +scoreJoueur2) ;
  }

  onNextRound() {
    this.tournoi.rondeEnCours++ ;
    this.rondeService.closeRonde(this.rondeActuelle, this.tournoi.tournamentName, this.tournoi.tournamentId) ;
    this.lancerUneRonde() ;
  }

  ngOnDestroy() {
    this.tournoiSubscription.unsubscribe() ;
    this.joueurSubscription.unsubscribe() ;
    this.matchSubscription.unsubscribe() ;
  }

  lancerUneRonde() {
    const nouvelleRonde = new Ronde(this.tournoi.tournamentName, this.tournoi.rondeEnCours) ;
    this.rondeActuelle = nouvelleRonde ;
    this.rondeService.createRonde(nouvelleRonde) ;
    this.tournoiService.upRondeEnCours(this.tournoi.tournamentId) ;
  }
}
