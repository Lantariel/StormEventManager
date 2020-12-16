import {Injectable} from '@angular/core';
import {Match} from '../models/match.model';
import {Subject} from 'rxjs';
import {firebase} from '@firebase/app';

@Injectable({
  providedIn: 'root'
})

export class MatchService {

  matches: Match[] = [] ; // Tableau de tous les matchs en cours
  matchesSubject = new Subject<Match[]>() ;

  constructor() { }

  emitMatches() {
    this.matchesSubject.next(this.matches) ;
  }

  saveMatches() {
    firebase.database().ref('/matches').set(this.matches) ;
  }

  getMatches() {
    firebase.database().ref('/matches').on('value', (data) => {
      this.matches = data.val() ? data.val() : [] ;
      this.emitMatches() ;
    });
  }

  createMatch(newMatch: Match) {
    this.matches.push(newMatch) ;
    this.saveMatches() ;
    this.emitMatches() ;
  }

  deleteMatch(match: Match) {
    const indexMatchASupprimer = this.matches.findIndex(
      (matchEl) => {
        if (matchEl === match) {
          return true ;
        }
      }
    );

    this.matches.splice(indexMatchASupprimer, 1) ;
    this.saveMatches() ;
    this.emitMatches() ;
  }

  updateMatchScore(id: number, score1: number, score2: number){
    this.matches[id].scoreJ1 = score1 ;
    this.matches[id].scoreJ2 = score2 ;
    this.saveMatches() ;
    this.emitMatches() ;
  }

  findMatchesByTournamentName(tnName: string) {
    let foundMatches: Match[] ;

    for (let i = 0 ; i < this.matches.length ; i++)
    {
      if (this.matches[i].tournamentName === tnName) { foundMatches.push(this.matches[i]) ; }
    }
    return foundMatches ;
  }

  closeMatches(tnName: string, tnId: number, rndNumber: string) {
    const matchToClose = this.findMatchesByTournamentName(tnName) ;

    firebase.database().ref('/tournois/' + tnId + '/rondes/' + rndNumber + 'matches').set(matchToClose) ;

    for (let i = 0 ; i < this.matches.length ; i++)
    {
      if (this.matches[i].tournamentName === tnName)
      {
        this.matches.splice(i, 1) ;
        i = 0 ;
      }
    }
    this.saveMatches() ;
    this.emitMatches() ;
  }

  deleteAllMatchs(id: number){

  }
}
