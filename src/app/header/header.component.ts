import { Component, OnInit } from '@angular/core';
import { firebase } from '@firebase/app';
import '@firebase/auth' ;
import {AuthService} from '../services/auth.service';
import {Joueur} from '../models/joueur.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isAuth: boolean;
  currentRoundNumber: number;
  currentRoundTimer: number;
  tournamentName: string;
  tournamentIsLive: boolean;

  listeDesInscrits: Joueur[] ;
  joueursActifs: Joueur[] ;

  constructor(private authService: AuthService) {
  }

  ngOnInit(): void {
    firebase.auth().onAuthStateChanged(
      (user) => {
        if (user) {
          this.isAuth = true;
        } else {
          this.isAuth = false;
        }
      }
    );

    this.tournamentIsLive = true;
  }

  onSignOut() {
    this.authService.signOutUser();
  }
}
