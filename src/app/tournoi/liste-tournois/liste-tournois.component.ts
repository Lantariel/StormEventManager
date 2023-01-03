import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {Tournoi} from '../../models/tournoi.model';
import {Subscription} from 'rxjs';
import {Ronde} from '../../models/ronde.model';
import {AuthService} from '../../services/auth.service';
import {PermissionsService} from '../../services/permissions.service';
import {Permission} from '../../models/permission.model';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {ScryfallService} from '../../services/scryfall.service';

@Component({
  selector: 'app-liste-tournois',
  templateUrl: './liste-tournois.component.html',
  styleUrls: ['./liste-tournois.component.scss']
})

export class ListeTournoisComponent implements OnInit, OnDestroy {

  tournois: Tournoi[] ;
  tournoiSubscription: Subscription ;

  rondes: Ronde[] ;

  displayDelete: any;

  apiUrl: string ;
  scryfallRequest: string ;

  imgSrc: string ;

  constructor(private tournoiService: TournoiService,
              private authService: AuthService,
              private permissionService: PermissionsService,
              private http: HttpClient,
              private scryfallService: ScryfallService,
              private router: Router) { }

  ngOnInit(): void {

    this.tournoiSubscription = this.tournoiService.tournoisSubject.subscribe(
      (tournois: Tournoi[]) => {
        this.tournois = [] ;
        for (let i = 0 ; i < tournois.length ; i++)
        {
          if (this.checkTournamentEditors(tournois[i]))
          { this.tournois.push(tournois[i]) ; }
        }
        //this.tournois = tournois ;
      }
    );

    this.tournoiService.getTournois() ;
    this.tournoiService.emitTournois() ;

    this.displayDelete = false ;
  }

  onNewTournoi() {
  this.router.navigate(['/creertournoi']) ;
  }

  onDeleteTournoi(tournoi: Tournoi) {
    this.tournoiService.supprimerTournoi(tournoi) ;
    this.hideDelete() ;
  }

  onOpenTournoi(id: number) {
    this.router.navigate(['/gerertournoi', this.tournois[id].tournamentId]) ;
  }

  ngOnDestroy() {
    this.tournoiSubscription.unsubscribe() ;
  }

  onOpenRondes(id){
    this.router.navigate(['gererronde', this.tournois[id].tournamentId]);
  }

  onOpenTop(id){
    this.router.navigate(['finalmatches', id]);
  }

  onOpenStandings(id){
    this.router.navigate(['tournamentresults', id]);

  }

  onToggleDelete(nb: number){
    if (this.displayDelete === false)
    { this.displayDelete = nb ; }
    else
    { this.displayDelete = false ; }
  }

  hideDelete(){
    this.displayDelete = false ;
  }

  checkTournamentEditors(tournoi: Tournoi){
    let isEditor = false ;

    for (let i = 0 ; i < tournoi.editors.length ; i++)
    {
      if (tournoi.editors[i] === this.authService.getCurrentUser().email)
      { isEditor = true ; }
    }
    return isEditor ;
  }

}
