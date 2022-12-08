import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ScryfallService {

  constructor(private http: HttpClient) { }

  getCard(scryfallID: string){
    const request = 'https://api.scryfall.com/cards/' + scryfallID ;

    this.http.get(request, {responseType: 'json'}).subscribe(
      resp => {
        return resp['name'] ;
      }
    );
  }

  getRandomCard(){
    const scryfallRequest = 'https://api.scryfall.com/cards/random ';
    const uris = 'image_uris' ;
    const img = 'normal' ;

    this.http.get(scryfallRequest, {responseType: 'json'}).subscribe(
      resp => {
        //console.log(resp) ;
        console.log(resp[uris][img]) ;
      }
    );
  }
}

