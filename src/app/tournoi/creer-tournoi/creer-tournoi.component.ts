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

  ngOnInit(): void {
    this.initForm() ;
    this.setDefaultDate() ;
  }

  setDefaultDate(){
    const today = new Date().toLocaleDateString("en-CA") ;
    this.tournoiForm.controls['tournamentDate'].setValue(today) ;
  }

  initForm() {
    this.tournoiForm = this.formBuilder.group({
      tournamentName: ['', Validators.required],
      tournamentFormat: ['', Validators.required],
      tournamentType: ['', Validators.required],
      tournamentPlace: ['', Validators.required],
      tournamentDate: ['', Validators.required]
    });
  }

  onSaveTournament() {
    const tournamentName = this.tournoiForm.get('tournamentName').value ;
    const tournamentFormat = this.tournoiForm.get('tournamentFormat').value ;
    const tournamentType = this.tournoiForm.get('tournamentType').value ;
    const tournamentPlace = this.tournoiForm.get('tournamentPlace').value ;
    const tournamentDate = this.tournoiForm.get('tournamentDate').value ;
    const newTournoi = new Tournoi(tournamentName, tournamentFormat, this.tournoiService.tournois.length) ;
    newTournoi.tournamentType = tournamentType ;
    newTournoi.tournamentPlace = tournamentPlace ;
    newTournoi.tournamentDate = tournamentDate ;

    newTournoi.rondeEnCours = 0 ;
    newTournoi.isLive = false ;
    newTournoi.inscriptionsOuvertes = true ;

    /*newTournoi.registeredPlayers = [] ;
    const bye = new Joueur('Bye', '', null) ;
    newTournoi.registeredPlayers.push(bye) ;*/

    this.tournoiService.createNewTournoi(newTournoi) ;
    this.router.navigate(['/listetournois']) ;
  }
}
