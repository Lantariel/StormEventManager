import { Component, OnInit } from '@angular/core';
import {Joueur} from '../../models/joueur.model';
import {Router} from '@angular/router';
import {JoueurService} from '../../services/joueur.service';
import {Subscription} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TournoiService} from '../../services/tournoi.service';
import {Tournoi} from '../../models/tournoi.model';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-joueurs-locaux',
  templateUrl: './joueurs-locaux.component.html',
  styleUrls: ['./joueurs-locaux.component.scss']
})
export class JoueursLocauxComponent implements OnInit {

  joueurs: Joueur[] ;
  joueurSubscription: Subscription ;

  tournois: Tournoi[] ;
  tournoiSubscription: Subscription ;

  chercherJoueur: FormGroup ;
  editPlayer: FormGroup ;

  toggleEdit: number ;

  constructor(private joueurService: JoueurService,
              private authService: AuthService,
              private tournoiService: TournoiService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit(): void {
    this.joueurSubscription = this.joueurService.joueursSubject.subscribe(
      (joueurs: Joueur[]) => {
        this.joueurs = joueurs ;
      }
    );

    this.tournoiSubscription = this.tournoiService.tournoisSubject.subscribe(
      (tournois: Tournoi[]) => {
        this.tournois = tournois ;
      }
    );

    this.joueurService.getPlayers() ;
    this.joueurService.emitPlayers() ;

    this.toggleEdit = -1 ;

    this.initForm() ;
  }

  initForm(){
    this.chercherJoueur = this.formBuilder.group({
      search: ['', Validators.required]
    }) ;

    this.editPlayer = this.formBuilder.group({
      editLastName: [''],
      editNickname: [''],
      editFirstName: ['']
    }) ;
  }

  onDeleteJoueur(joueur: Joueur) {
    this.joueurService.supprimerJoueur(joueur) ;
  }

  onAjouterJoueur() {
    this.router.navigate(['/addplayer']) ;
  }

  matchResearch(id: number){
    const research = this.chercherJoueur.get('search').value ;

    if (research === '')
    { return true ; }

    else
    {
      return this.joueurs[id].firstName.toLowerCase().search(research) !== -1
        || this.joueurs[id].lastName.toLowerCase().search(research) !== -1
        || this.joueurs[id].nickname.toLowerCase().search(research) !== -1
        || this.joueurs[id].playerID.toLowerCase().search(research) !== -1 ;
    }
  }

  onEditPlayer(id: number){
    this.toggleEdit = id ;
    this.editPlayer.controls['editLastName'].setValue(this.joueurs[id].lastName) ;
    this.editPlayer.controls['editNickname'].setValue(this.joueurs[id].nickname) ;
    this.editPlayer.controls['editFirstName'].setValue(this.joueurs[id].firstName) ;
  }

  onCancelEdit(){
    this.toggleEdit = -1 ;
  }

  onValidateChanges(id: number){
    const lastname = this.editPlayer.get('editLastName').value ;
    const nickname = this.editPlayer.get('editNickname').value ;
    const firstname = this.editPlayer.get('editFirstName').value ;

    this.joueurs[id].lastName = lastname ;
    this.joueurs[id].nickname = nickname ;
    this.joueurs[id].firstName = firstname ;

    this.joueurService.editPlayer(this.joueurs[id]) ;
    this.tournoiService.updatePlayerName(this.joueurs[id]) ;

    this.onCancelEdit() ;
  }

  /*setEloValue(){
    for (let i = 0 ; i < this.joueurs.length ; i++)
    { this.joueurs[i].eloValue = 1000 ; }
    this.joueurService.sauvegarderJoueurs() ;
    this.joueurService.emitPlayers() ;
  }*/
}
