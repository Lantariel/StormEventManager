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
import {AuthService} from '../../services/auth.service';

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
  nombreDeJoueurs: number ;

/* === Récuperation des données des joueurs et des tournois === */

  tournois: Tournoi[] ;
  tournoiSubscription: Subscription ;
  joueurs: Joueur[] ;
  joueurSubscription: Subscription ;

  joueursDuTournoi: Joueur[] ;

/* === Formulaires ==== */

  formInscription: FormGroup ; // Le formulaire d'inscription
  formRecherche: FormGroup ; // Formulaire de recherche
  formRondes: FormGroup ; // Formulaire pour forcer un nombre de rondes
  formTop: FormGroup ; // Formulaire pour fixer les phases éliminatoires
  formRegResearch: FormGroup ; // Recherche d'un joueur inscrit

/* === Recherche d'un joueur dans la base de donnée ==== */

  joueursTrouves: Joueur[] = []; // Résultat de la recherche
  tempJoueur: Joueur ; // Utile à l'inscription par recherche

  constructor(private route: ActivatedRoute,
              private authService: AuthService,
              private tournoiService: TournoiService,
              private joueurService: JoueurService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit(): void {

    const id = this.route.snapshot.params['id'] ;
    this.tournoi = new Tournoi('', '', id);

    this.tournoiService.getTournois() ;
    this.tournoiService.emitTournois() ;

    this.joueurService.getPlayers() ;
    this.joueurService.emitPlayers() ;

    this.currentTournamentIndex = id ; // Récupère l'ID du tournoi administré

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        if (this.tournoi.registeredPlayers)
        { this.nombreDeJoueurs = this.tournoi.registeredPlayers.length ; }
        else
        {
          this.nombreDeJoueurs = 0 ;
          this.tournoi.registeredPlayers = [] ;
        }

        if (this.tournoi.roundNumberIsFixed === true)
        { this.forceRoundNumber = this.tournoi.nombreDeRondes ; }

        this.joueursDuTournoi = this.tournoi.registeredPlayers ;
    }) ;

    this.joueurSubscription = this.joueurService.joueursSubject.subscribe(
      (joueurs: Joueur[]) => {
        this.joueurs = joueurs ;
      }
    );

    this.onInitForm() ;
    this.onInitRecherche() ;
    this.onInitFormRondes() ;
    this.onInitFormTop() ;
  }

  onInitForm() {
    this.formInscription = this.formBuilder.group({
      player: ['', Validators.required]
    }) ;

    this.formRegResearch = this.formBuilder.group({
      regSearch: ['']
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

  onInitFormTop(){
    this.formTop = this.formBuilder.group({
      fixTop: ['', Validators.required]
    }) ;
 }

  onInscrireJoueurDepuisRecherche(id: string) {
    this.alreadyRegistered = false ; // Vérifie si le joueur est déjà inscrit
    this.tempJoueur = null ; // Objet joueur temporaire initialisé à 0

    for (let i = 0 ; i < this.joueurs.length ; i++) // Parcours du tableau des joueurs pour trouver celui qu'on cherche
    {
      if (id === this.joueurs[i].playerID.toString())
      { this.tempJoueur = this.joueurs[i] ; }
    }

    if (this.tournoi.registeredPlayers)
    {
      for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++) // Parcours du tableau des joueurs déjà inscrits
      {
        if (this.tournoi.registeredPlayers[i].playerID === this.tempJoueur.playerID)
        { this.alreadyRegistered = true ; }
      }
    }

    if (this.alreadyRegistered === false) // Si on a pas trouvé de doublon
    {
      this.tempJoueur.commander = 'x' ;
      this.tempJoueur.commanderImgUrl = 'x' ;
      this.tournoi.registeredPlayers.push(this.tempJoueur) ; // Ajout du joueur au tableau local
      this.tournoiService.ajouterUnJoueur(this.currentTournamentIndex, this.tempJoueur); // Ajout du joueur au tournoi dans la database et mise à jour de la DB
    }
    else { console.log( 'Joueur déjà inscrit !' ) ; } // Si le joueur est déjà inscrit

    this.nombreDeJoueurs++ ;
    this.calculerNombreDeRondes() ;
  }

  onDesinscrireJoueur(id: number) {

    if (this.tournoi.inscriptionsOuvertes === true)
    {
      const joueur = this.tournoi.registeredPlayers[id] ; // Récupère l'objet joueur à supprimer
      this.tournoi.registeredPlayers.splice(id, 1) ; // Suppression du joueur dans le tableau local
      this.tournoiService.retirerUnJoueur(this.tournoi, joueur) ; // Supprime le joueur via le service des tournois

      this.calculerNombreDeRondes() ;
      this.nombreDeJoueurs-- ;
    }
  }

  onChercherJoueurLocal() {

    const recherche = this.formRecherche.get('chercheJoueur').value ;
    recherche.toLowerCase() ;
    this.joueursTrouves = [] ;

    if (recherche !== '') // Ne lance la recherche que si il y a un caractère à chercher
    {
      for (let i = 0 ; i < this.joueurs.length ; i++) {
        if (this.joueurs[i].firstName.toLowerCase().search(recherche.toLowerCase()) !== -1 )
        {
          if (!this.checkIfPlayerAlreadyRegistered(this.joueurs[i].playerID))
          { this.joueursTrouves.push(this.joueurs[i]) ; }
        }
        else if (this.joueurs[i].lastName.toLowerCase().search(recherche.toLowerCase()) !== -1 )
        {
          if (!this.checkIfPlayerAlreadyRegistered(this.joueurs[i].playerID))
          { this.joueursTrouves.push(this.joueurs[i]) ; }
        }
        else if (this.joueurs[i].nickname.toLowerCase().search(recherche.toLowerCase()) !== -1 )
        {
          if (!this.checkIfPlayerAlreadyRegistered(this.joueurs[i].playerID))
          { this.joueursTrouves.push(this.joueurs[i]) ; }
        }
        else if (this.joueurs[i].playerID.toString().search(recherche.toLowerCase()) !== -1 )
        {
          if (!this.checkIfPlayerAlreadyRegistered(this.joueurs[i].playerID))
          { this.joueursTrouves.push(this.joueurs[i]) ; }
        }
      }
    }
  }

  onClearReasearch(){
    this.joueursTrouves = [] ;
    this.formRecherche.reset() ;
  }

  checkIfPlayerAlreadyRegistered(pId: string){
    let alreadyRegistered = false ;

    if(this.tournoi.registeredPlayers)
    {
      for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
      {
        if (this.tournoi.registeredPlayers[i].playerID === pId.toString())
        {
          alreadyRegistered = true ;
          i = this.tournoi.registeredPlayers.length ;
        }
      }
    }

    return alreadyRegistered ;
  }

  ngOnDestroy() {

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

    this.tournoiService.setRoundNumber(this.tournoi.tournamentId, this.tournoi.nombreDeRondes) ;
  }

  onForcerRondes() {
    const nb = this.formRondes.get('nombreAForcer').value ;
    this.forcerNombreDeRondes(nb) ;
    this.formRondes.reset() ;
    this.tournoi.roundNumberIsFixed = true ;
  }

  onSetTournamentTop() {
    const nb = this.formTop.get('fixTop').value ;

    if (+nb === 0)
    {
      this.tournoi.tournamentCut = 8 ;
      this.tournoiService.setTournamentTop(this.tournoi.tournamentId, 8) ;
    }

    else if (+nb === 1)
    {
      this.tournoi.tournamentCut = 4 ;
      this.tournoiService.setTournamentTop(this.tournoi.tournamentId, 4) ;
    }
    else if (+nb === 2)
    {
      this.tournoi.tournamentCut = 2 ;
      this.tournoiService.setTournamentTop(this.tournoi.tournamentId, 2) ;
    }
    else
    {
      this.tournoi.tournamentCut = 8 ;
      this.tournoiService.setTournamentTop(this.tournoi.tournamentId, 8) ;
    }
    this.formTop.reset() ;
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
    this.tournoiService.desactivateFixedRoundNumber(this.currentTournamentIndex, this.tournoi.nombreDeRondes) ;
    this.tournoi.roundNumberIsFixed = false ;
  }

  onCommencerTournoi() {
    this.router.navigate(['prelaunch', this.currentTournamentIndex]) ;
  }

  routeToRondes() {
    this.router.navigate(['gererronde', this.currentTournamentIndex]) ;
  }

  onToggleFinals(){
    this.tournoi.finalBracket = !this.tournoi.finalBracket;
    this.tournoiService.setFinalsActivation(this.tournoi.tournamentName, this.tournoi.finalBracket) ;
  }

  matchResearch(id: number){

    const research = this.formRecherche.get('chercheJoueur').value ;

    if (research === '')
    { return false ; }

    else if (this.checkIfPlayerAlreadyRegistered(this.joueurs[id].playerID))
    { return false ; }

    else
    {
      return this.joueurs[id].firstName.toLowerCase().search(research) !== -1
        || this.joueurs[id].lastName.toLowerCase().search(research) !== -1
        || this.joueurs[id].nickname.toLowerCase().search(research) !== -1
        || this.joueurs[id].playerID.toLowerCase().search(research.toString()) !== -1;
    }
  }

  matchRegResearch(id: number){
    const regResearch = this.formRegResearch.get('regSearch').value ;

    if (regResearch === '' && this.tournoi.registeredPlayers[id].firstName !== 'Bye') { return true ; }

    else if (this.tournoi.registeredPlayers[id].firstName === 'Bye') { return false ; }

    else
    {
      return this.tournoi.registeredPlayers[id].firstName.toLowerCase().search(regResearch) !== -1
        || this.tournoi.registeredPlayers[id].lastName.toLowerCase().search(regResearch) !== -1
        || this.tournoi.registeredPlayers[id].nickname.toLowerCase().search(regResearch) !== -1 ;
    }
  }
}
