import { Injectable } from '@angular/core';
import {Deck} from '../models/deck.model';
import {Subject} from 'rxjs';
import {firebase} from '@firebase/app';

@Injectable({
  providedIn: 'root'
})
export class DeckService {

  decks: Deck[] ;
  deckSubject = new Subject<Deck[]>() ;

  constructor() { }

  emitDecks(){
    this.deckSubject.next(this.decks) ;
  }

  saveDecks(){
    firebase.database().ref('/decks').set(this.decks) ;
  }

  getDecks(){
    firebase.database().ref('/decks').on('value', (data) => {
      this.decks = data.val() ? data.val() : [] ;
      this.emitDecks() ;
    }) ;
  }

  getSingleDeck(id: number){
    return new Promise(
      (resolve, reject) => {
        firebase.database().ref('/decks/' + id).once('value').then(
          (data) => {
            resolve(data.val());
          }, (error) => {
            reject(error) ;
          }
        );
      }
    );
  }

  createNewDeck(deck: Deck){
    this.decks.push(deck) ;
    this.saveDecks() ;
    this.emitDecks() ;
  }

  deckAlreadyExists(deck: Deck){
    let alreadyExists = false ;

    for (let i = 0 ; i < this.decks.length ; i++)
    {
      if (this.decks[i].deckname === deck.deckname)
      { alreadyExists = true ; }
    }
    return alreadyExists ;
  }
}
