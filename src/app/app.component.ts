import { Component } from '@angular/core';
import { firebase } from '@firebase/app' ;
import '@firebase/auth' ;
import '@firebase/analytics' ;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
    lastKnownTournamentId: number ;

    constructor() {

      var firebaseConfig = {
        apiKey: "AIzaSyBKCkHL9XeNWW2Na7-GT1ytHJx8gs82Smk",
        authDomain: "stormeventmanager.firebaseapp.com",
        databaseURL: "https://stormeventmanager.firebaseio.com",
        projectId: "stormeventmanager",
        storageBucket: "stormeventmanager.appspot.com",
        messagingSenderId: "808708669706",
        appId: "1:808708669706:web:e4e779ade6c0bc79d1faf3",
        measurementId: "G-H6E432BTM0"
      };

      firebase.initializeApp(firebaseConfig);
      firebase.analytics();
      this.lastKnownTournamentId = 0;
    }
}
