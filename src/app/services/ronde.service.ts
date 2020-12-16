import {Injectable} from '@angular/core';
import {Ronde} from '../models/ronde.model';
import {Subject} from 'rxjs';
import {firebase} from '@firebase/app';
import {Match} from '../models/match.model';

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
    //this.rondes[idRonde].finalStandings = ronde.finalStandings ;

    firebase.database().ref('/tournois/' + tnId + '/rondes/' + ronde.roundNumber).set(this.rondes[idRonde]) ;

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
}
