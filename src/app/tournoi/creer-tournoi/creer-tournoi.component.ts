import { Component, OnInit } from '@angular/core';
import {Form, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TournoiService} from '../../services/tournoi.service';
import {Router} from '@angular/router';
import {Tournoi} from '../../models/tournoi.model';
import {Joueur} from '../../models/joueur.model';

@Component({
  selector: 'app-creer-tournoi',
  templateUrl: './creer-tournoi.component.html',
  styleUrls: ['./creer-tournoi.component.scss']
})
export class CreerTournoiComponent implements OnInit {

  tournoiForm: FormGroup ;

  constructor(private formBuilder: FormBuilder,
              private tournoiService: TournoiService,
              private router: Router) { }

  ngOnInit(): void { this.initForm() ; }

  initForm() {
    this.tournoiForm = this.formBuilder.group({
      tournamentName: ['', Validators.required],
      tournamentFormat: ['', Validators.required]
    });
  }

  onSaveTournament() {
    const tournamentName = this.tournoiForm.get('tournamentName').value ;
    const tournamentFormat = this.tournoiForm.get('tournamentFormat').value ;
    const newTournoi = new Tournoi(tournamentName, tournamentFormat, this.tournoiService.tournois.length) ;

    newTournoi.rondeEnCours = 0 ;
    newTournoi.isLive = false ;
    newTournoi.inscriptionsOuvertes = true ;
    newTournoi.registeredPlayers = [] ;

    const bye = new Joueur('Bye', '', null) ;
    newTournoi.registeredPlayers.push(bye) ;

    this.tournoiService.createNewTournoi(newTournoi) ;
    this.router.navigate(['/listetournois']) ;
  }
}
