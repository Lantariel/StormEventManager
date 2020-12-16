import { Injectable } from '@angular/core';
import {Joueur} from '../models/joueur.model';
import {Subject} from 'rxjs';
import { firebase } from '@firebase/app';
import '@firebase/auth' ;
import '@firebase/database';
import '@firebase/storage' ;

@Injectable({
  providedIn: 'root'
})

export class JoueurService {

  joueurs: Joueur[] = [] ;
  joueursSubject = new Subject<Joueur[]>() ;

  constructor() { }

  emitPlayers() {
    this.joueursSubject.next(this.joueurs) ;
  }

  sauvegarderJoueurs() {
    firebase.database().ref('/joueurs').set(this.joueurs) ;
  }

  getPlayers() {
    firebase.database().ref('/joueurs').on('value', (data) => {
      this.joueurs = data.val() ? data.val() : [] ;
      this.emitPlayers() ;
    });
  }

  getPlayersFromTournament(id: number) {
      firebase.database().ref('/tournois/' + id + 'registeredPlayers').on('value', (data) => {
      this.joueurs = data.val() ? data.val() : [] ;
      this.emitPlayers() ;
    });
  }

  getSinglePlayer(id: number) {
    return new Promise(
      (resolve, reject) => {
        firebase.database().ref('/joueurs/' + id).once('value').then(
          (data) => {
            resolve(data.val());
          }, (error) => {
            reject(error) ;
          }
        );
      }
    );
  }

  creerNouveauJoueur(newJoueur: Joueur) {
    this.joueurs.push(newJoueur) ;
    this.sauvegarderJoueurs() ;
    this.emitPlayers() ;
  }

  supprimerJoueur(joueur: Joueur) {
    const indexJoueurASupprimer = this.joueurs.findIndex(
      (joueurEl) => {
      if(joueurEl === joueur) {
        return true ;
      }
      }
    );

    this.joueurs.splice(indexJoueurASupprimer, 1) ;
    this.sauvegarderJoueurs() ;
    this.emitPlayers() ;
  }
}
