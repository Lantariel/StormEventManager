import {Injectable} from '@angular/core';
import {Ronde} from '../models/ronde.model';
import {Subject} from 'rxjs';
import {firebase} from '@firebase/app';
import {Match} from '../models/match.model';
import {Joueur} from '../models/joueur.model';

@Injectable({
  providedIn: 'root'
})

export class RondeService {

  rondes: Ronde[] = []; // Les rondes en train d'être jouées
  rondeSubject = new Subject<Ronde[]>();

  constructor() { }

  emitRondes() {
    this.rondeSubject.next(this.rondes);
  }

  saveRondes() {
    firebase.database().ref('/rondes').set(this.rondes);
  }

  getRondes() {
    firebase.database().ref('/rondes').on('value', (data) => {
      this.rondes = data.val() ? data.val() : [];
      this.emitRondes();
    }) ;
  }

  createRonde(newRonde: Ronde) {
    this.rondes.push(newRonde);
    this.saveRondes();
    this.emitRondes();
  }

  deleteRonde(ronde: Ronde) {
    const indexRondeASupprimer = this.rondes.findIndex(
      (rondeEl) => {
        if (rondeEl === ronde) {
          return true;
        }
      }
    );

    this.rondes.splice(indexRondeASupprimer, 1) ;
    this.saveRondes() ;
    this.emitRondes() ;
  }

  closeRonde(ronde: Ronde, tnName: string, tnId: number) {

    let idRonde: number ; // Ronde à fermer

    for (let i = 0 ; i < this.rondes.length ; i++)
    {
      if (this.rondes[i].tournament === tnName) // Ciblage de la ronde dans le service via le nom du tournoi
      { idRonde = i ; }
    }
    this.rondes[idRonde].finalStandings = ronde.finalStandings ;

    this.rondes.splice(idRonde, 1) ;
    this.saveRondes() ;
    this.emitRondes() ;
  }

  getRondebyTournamentName(tnName: string) {

    let rondeToFind: Ronde ;
    for (let i = 0 ; i < this.rondes.length ; i++)
    {
      if (this.rondes[i].tournament === tnName)
      { rondeToFind = this.rondes[i] ; }
    }
    return rondeToFind ;
  }

  forceEndOfRoundForTest(tnName: string, players: Joueur[]) {
    let idRonde: number ; // Ronde à fermer

    for (let i = 0 ; i < this.rondes.length ; i++)
    {
      if (this.rondes[i].tournament === tnName) // Ciblage de la ronde dans le service via le nom du tournoi
      { idRonde = i ; }
    }
    this.rondes[idRonde].finalStandings = players ;
  }

  startMatchesInRound(tnName: string){

    for (let i = 0 ; i < this.rondes.length ; i++)
    {
      if (this.rondes[i].tournament === tnName)
      { this.rondes[i].hasStarted = true ; }
    }

    this.saveRondes() ;
    this.emitRondes() ;
  }

  addMatchesToround(tnName: string, matches: Match[]) {
    let ronde = 0 ;

    for (let i = 0 ; i < this.rondes.length ; i++)
    {
      if (this.rondes[i].tournament === tnName)
      { this.rondes[i].currentMatches = matches ; i = this.rondes.length ; }
    }

    this.saveRondes() ;
    this.emitRondes() ;
  }

  updateScores(tnName: string, matchID: number, score1: number, score2: number){
    for (let i = 0 ; i < this.rondes.length ; i++)
    {
      if (this.rondes[i].tournament === tnName)
      {
        this.rondes[i].currentMatches[matchID].scoreJ1 = score1 ;
        this.rondes[i].currentMatches[matchID].scoreJ2 = score2 ;
        this.rondes[i].currentMatches[matchID].scoreAlreadySubmitted = true ;
        i = this.rondes.length ;
      }
    }

    this.saveRondes() ;
    this.emitRondes() ;
  }
}
