import { Component, OnInit } from '@angular/core';
import {Joueur} from '../../models/joueur.model';
import {Router} from '@angular/router';
import {JoueurService} from '../../services/joueur.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-joueurs-locaux',
  templateUrl: './joueurs-locaux.component.html',
  styleUrls: ['./joueurs-locaux.component.scss']
})
export class JoueursLocauxComponent implements OnInit {

  joueurs: Joueur[] ;
  joueurSubscription: Subscription ;

  constructor(private joueurService: JoueurService,
              private router: Router) { }

  ngOnInit(): void {
    this.joueurSubscription = this.joueurService.joueursSubject.subscribe(
      (joueurs: Joueur[]) => {
        this.joueurs = joueurs ;
      }
    );

    this.joueurService.getPlayers() ;
    this.joueurService.emitPlayers() ;
  }

  onDeleteJoueur(joueur: Joueur) {
    this.joueurService.supprimerJoueur(joueur) ;
  }

  onAjouterJoueur() {
    this.router.navigate(['/addplayer']) ;
  }
}
