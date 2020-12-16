import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {Tournoi} from '../../models/tournoi.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Joueur} from '../../models/joueur.model';
import {JoueurService} from '../../services/joueur.service';
import {VariablesGlobales} from '../../services/variablesGlobales';
import {Ronde} from '../../models/ronde.model';
import {RondeService} from '../../services/ronde.service';

@Component({
  selector: 'app-gerer-tournoi',
  templateUrl: './gerer-tournoi.component.html',
  styleUrls: ['./gerer-tournoi.component.scss']
})
export class GererTournoiComponent implements OnInit, OnDestroy {

  tournoi: Tournoi ; // Le tournoi dont on gère les inscriptions
  alreadyRegistered: boolean ; // Vérifie si un joueur est déjà inscrit ;

  currentTournamentIndex: number ; // Index dans la base du tournoi en cours
  forceRoundNumber: number = null ; // Permet de forcer le nombre de rondes

/* === Récuperation des données des joueurs et des tournois === */

  tournois: Tournoi[] ;
  tournoiSubscription: Subscription ;
  joueurs: Joueur[] ;
  joueurSubscription: Subscription ;

/* === Formulaires ==== */

  formInscription: FormGroup ; // Le formulaire d'inscription
  formRecherche: FormGroup ; // Formulaire de recherche
  formRondes: FormGroup ; // Formulaire pour forcer un nombre de rondes

/* === Recherche d'un joueur dans la base de donnée ==== */

  joueursTrouves: Joueur[] = []; // Résultat de la recherche
  tempJoueur: Joueur ; // Utile à l'inscription par recherche

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private joueurService: JoueurService,
              private rondeService: RondeService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit(): void {

    const id = this.route.snapshot.params['id'] ;
    this.tournoi = new Tournoi('', '', id);

    this.currentTournamentIndex = id ; // Récupère l'ID du tournoi administré

    this.tournoiSubscription = this.tournoiService.tournoisSubject.subscribe(
      (tournois: Tournoi[]) => {
        this.tournois = tournois ;
      }
    );

    this.tournoiService.getTournois() ;
    this.tournoiService.emitTournois() ;

    this.joueurSubscription = this.joueurService.joueursSubject.subscribe(
      (joueurs: Joueur[]) => {
        this.joueurs = joueurs ;
      }
    );

    this.joueurService.getPlayers() ;
    this.joueurService.emitPlayers() ;

    this.tournoi = this.tournois[id] ;

    this.onInitForm() ;
    this.onInitRecherche() ;
    this.onInitFormRondes() ;
    this.calculerNombreDeRondes() ;
  }

  onInitForm() {
    this.formInscription = this.formBuilder.group({
      player: ['', Validators.required]
    }) ;
  }

  onInitRecherche() {
  this.formRecherche = this.formBuilder.group({
  chercheJoueur: ['', Validators.required]
  });
 }

  onInitFormRondes() {
    this.formRondes = this.formBuilder.group({
      nombreAForcer: ['', Validators.required]
    });
 }

  onInscrireJoueurDepuisRecherche(id: string) {
    this.alreadyRegistered = false ; // Vérifie si le joueur est déjà inscrit
    this.tempJoueur = null ; // Objet joueur temporaire initialisé à 0

    for (let i = 0 ; i < this.joueurs.length ; i++) // Parcours du tableau des joueurs pour trouver celui qu'on cherche
    {
      if (id === this.joueurs[i].playerID.toString())
      { this.tempJoueur = this.joueurs[i] ; }
    }

    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++) // Parcours du tableau des joueurs déjà inscrits
    {
      if (this.tournoi.registeredPlayers[i].playerID === this.tempJoueur.playerID)
      { this.alreadyRegistered = true ; }
    }

    if (this.alreadyRegistered === false) // Si on a pas trouvé de doublon
    {
      this.tournoi.registeredPlayers.push(this.tempJoueur) ; // Ajout du joueur au tableau local
      this.tournoiService.ajouterUnJoueur(this.currentTournamentIndex, this.tempJoueur); // Ajout du joueur au tournoi dans la database et mise à jour de la DB
    }
    else { console.log( 'Joueur déjà inscrit !' ) ; } // Si le joueur est déjà inscrit

    this.joueursTrouves = [] ;
    this.formRecherche.reset() ;
    this.calculerNombreDeRondes() ;
  }

  onDesinscrireJoueur(id: number) {

    if (this.tournoi.inscriptionsOuvertes === true)
    {
      const joueur = this.tournoi.registeredPlayers[id] ; // Récupère l'objet joueur à supprimer
      this.tournoi.registeredPlayers.splice(id, 1) ; // Suppression du joueur dans le tableau local
      this.tournoiService.retirerUnJoueur(this.tournoi, joueur) ; // Supprime le joueur via le service des tournois

      this.calculerNombreDeRondes() ;
    }
  }

  onChercherJoueurLocal() {

    const recherche = this.formRecherche.get('chercheJoueur').value ;
    recherche.toLowerCase() ;
    this.joueursTrouves = [] ;

    if (recherche !== '') // Ne lance la recherche que si il y a un caractère à chercher
    {
      for (let i = 0 ; i < this.joueurs.length ; i++) {
        if (this.joueurs[i].firstName.toLowerCase().search(recherche.toLowerCase()) !== -1 ) { this.joueursTrouves.push(this.joueurs[i]) ; }
        else if (this.joueurs[i].lastName.toLowerCase().search(recherche.toLowerCase()) !== -1 ) { this.joueursTrouves.push(this.joueurs[i]) ; }
        else if (this.joueurs[i].playerID.toString().search(recherche.toLowerCase()) !== -1 ) { this.joueursTrouves.push(this.joueurs[i]) ; }
      }
    }
  }

  ngOnDestroy() {
    this.tournoiSubscription.unsubscribe() ;
    this.joueurSubscription.unsubscribe() ;
  }

  calculerNombreDeRondes() {

    if (this.forceRoundNumber === null) {

      if ( this.tournoi.registeredPlayers.length < 4) {this.tournoi.nombreDeRondes = 0 ; }
      if ( this.tournoi.registeredPlayers.length > 3 && this.tournoi.registeredPlayers.length < 6) {this.tournoi.nombreDeRondes = 2 ; }
      if ( this.tournoi.registeredPlayers.length > 5 && this.tournoi.registeredPlayers.length < 9) {this.tournoi.nombreDeRondes = 3 ; }
      if ( this.tournoi.registeredPlayers.length > 9 && this.tournoi.registeredPlayers.length < 18) {this.tournoi.nombreDeRondes = 4 ; }
      if ( this.tournoi.registeredPlayers.length > 17 && this.tournoi.registeredPlayers.length < 34) {this.tournoi.nombreDeRondes = 5 ; }
      if ( this.tournoi.registeredPlayers.length > 33 && this.tournoi.registeredPlayers.length < 66) {this.tournoi.nombreDeRondes = 6 ; }
      if ( this.tournoi.registeredPlayers.length > 65 && this.tournoi.registeredPlayers.length < 130) {this.tournoi.nombreDeRondes = 7 ; }
      if ( this.tournoi.registeredPlayers.length > 129 && this.tournoi.registeredPlayers.length < 227) {this.tournoi.nombreDeRondes = 8 ; }
    }

    this.tournoiService.setRoundNumber(+this.currentTournamentIndex, this.tournoi.nombreDeRondes) ;
  }

  onForcerRondes() {
    const nb = this.formRondes.get('nombreAForcer').value ;
    this.forcerNombreDeRondes(nb) ;
    this.formRondes.reset() ;
  }

  forcerNombreDeRondes(nb: number) {
    this.tournoi.nombreDeRondes = nb ;
    this.forceRoundNumber = nb ;
    this.tournoiService.setRoundNumber(this.currentTournamentIndex, this.tournoi.nombreDeRondes) ;
    this.tournoiService.activateFixedRoundNumber(this.currentTournamentIndex) ;
  }

  onAnnulerForcageDesRondes() {
    this.forceRoundNumber = null ;
    this.calculerNombreDeRondes() ;
    this.tournoiService.desactivateFixedRoundNumber(this.currentTournamentIndex) ;
  }

  onCommencerTournoi() {
    this.tournoi.isLive = true ;
    this.tournoi.inscriptionsOuvertes = false ;
    this.tournoi.rondeEnCours = 1 ;
    this.tournoiService.beginTournament(this.currentTournamentIndex) ;
    const nouvelleRonde = new Ronde(this.tournoi.tournamentName, this.tournoi.rondeEnCours) ;
    this.rondeService.createRonde(nouvelleRonde) ;
    this.router.navigate(['gererronde', this.currentTournamentIndex]) ;
  }

  routeToRondes() {
    this.router.navigate(['gererronde', this.currentTournamentIndex]) ;
  }
}
