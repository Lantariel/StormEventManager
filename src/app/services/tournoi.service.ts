import { Injectable } from '@angular/core';
import {Tournoi} from '../models/tournoi.model';
import {Subject} from 'rxjs';
import { firebase } from '@firebase/app';
import '@firebase/auth' ;
import '@firebase/database';
import '@firebase/storage' ;
import {Joueur} from '../models/joueur.model';
import {HttpClient} from '@angular/common/http';
import {Ronde} from '../models/ronde.model';

@Injectable({
  providedIn: 'root'
})

export class TournoiService {

  tournois: Tournoi[] = [] ;
  tournoisSubject = new Subject<Tournoi[]>() ;

  constructor(private httpClient: HttpClient) { }

  emitTournois() {
    this.tournoisSubject.next(this.tournois) ;
  }

  saveTournoi() {
    this.updateTournamentIds() ;
    firebase.database().ref('/tournois').set(this.tournois) ;
  }

  getTournois() {
    firebase.database().ref('/tournois').on('value', (data) => {
      this.tournois = data.val() ? data.val() : [] ;
      this.emitTournois() ;
    }) ;
  }

  getSingleTournoi(id: number) {
    return new Promise(
      (resolve, reject) => {
        firebase.database().ref('/tournois/' + id).once('value').then(
          (data) => {
            resolve(data.val());
          }, (error) => {
            reject(error) ;
          }
        );
      }
    );
  }

  createNewTournoi(newTournoi: Tournoi) {
    newTournoi.tournamentIndex = this.tournois.length ;
    newTournoi.nombreDeRondes = 0 ;
    this.tournois.push(newTournoi) ;
    this.saveTournoi();
    this.emitTournois();
  }

  supprimerTournoi(tournoi: Tournoi){
    const indexTournoiASupprimer = this.tournois.findIndex(
      (tournoiEl) => {
        if(tournoiEl === tournoi) {
          return true ;
        }
      }
    );
    this.tournois.splice(indexTournoiASupprimer, 1);
    this.saveTournoi();
    this.emitTournois();
  }

  ajouterUnJoueur(id: number, joueur: Joueur) {
    this.tournois[id].registeredPlayers.push(joueur) ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  retirerUnJoueur(tournoi: Tournoi, joueur: Joueur) {

    const indexJoueurATrouver = tournoi.registeredPlayers.findIndex(
      (joueurEl: Joueur) => {
        if (joueurEl === joueur) {
          return true ;
        }
      }
    );

    this.tournois[tournoi.tournamentIndex].registeredPlayers = tournoi.registeredPlayers ; // copie du tableau local dans le tableau des tournois
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  setRoundNumber(id: number , nb: number){

    this.tournois[id].nombreDeRondes = nb ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  activateFixedRoundNumber(id: number){
    this.tournois[id].roundNumberIsFixed = true ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  desactivateFixedRoundNumber(id: number){
    this.tournois[id].roundNumberIsFixed = false ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  beginTournament(id: number){
    this.tournois[id].inscriptionsOuvertes = false ;
    this.tournois[id].rondeEnCours = 1 ;
    this.tournois[id].isLive = true ;

    for (let i = 1 ; i < this.tournois[id].registeredPlayers.length ; i++) {
      this.tournois[id].registeredPlayers[i].matchsPlayed = 0 ;
      this.tournois[id].registeredPlayers[i].score = 0 ;
      this.tournois[id].registeredPlayers[i].previousOpponents = [0] ;
      this.tournois[id].registeredPlayers[i].playerIndexInEvent = i ;
      this.tournois[id].registeredPlayers[i].status = 'active' ;
    }

    this.tournois[id].registeredPlayers.splice(0, 1) ;
    this.tournois[id].currentStanding = this.shuffleInPlace(this.tournois[id].registeredPlayers) ;

    this.saveTournoi() ;
    this.emitTournois() ;
  }

  updateTournamentIds(){
    for (let i = 0 ; i < this.tournois.length ; i++) {
      this.tournois[i].tournamentIndex = i ;
      this.tournois[i].tournamentId = i ;
    }
  }

  endTournament(id: number){
    this.tournois[id].isFinished = true ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  getRandom(floor: number, ceiling: number) {
    return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
  }

  shuffleInPlace(array: Joueur[]) {
    let temp: Joueur ;
    // if it's 1 or 0 items, just return
    if (array.length <= 1) return array;

    // For each index in array
    for (let i = 0 ; i < array.length; i++)
    {
      // choose a random not-yet-placed item to place there
      // must be an item AFTER the current item, because the stuff
      // before has all already been placed
      const randomChoiceIndex = this.getRandom(i, array.length - 1);

      // place our random choice in the spot by swapping
      temp = array[i] ;
      array[i] = array[randomChoiceIndex] ;
      array[randomChoiceIndex] = temp ;
    }
    return array;
  }

  updateTournamentRounds(id: number, ronde: Ronde) {
    this.tournois[id].rondes.push(ronde) ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  upRondeEnCours(id: number) {
    this.tournois[id].rondeEnCours++ ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  addNewRound(id: number, newRound: Ronde){
    this.tournois[id].rondes.push(newRound) ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }

  getplayersFromLastRound(tnId: number){
    if (this.tournois[tnId].rondes.length === 1) // si on est à la première ronde
      { return this.tournois[tnId].currentStanding ; }
    else
      { return this.tournois[tnId].rondes[this.tournois[tnId].rondes.length - 1].finalStandings ; }
  }

  updateRegisteredPlayers(tnId: number, joueurs: Joueur[]){
    this.tournois[tnId].registeredPlayers = joueurs ;
    this.saveTournoi() ;
    this.emitTournois() ;
  }
}
