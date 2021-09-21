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
        this.tournois = tournois ;
      }
    );

    this.tournoiService.getTournois() ;
    this.tournoiService.emitTournois() ;

    this.displayDelete = false ;
    //this.checkIfPermissionExists() ;
  }

  onNewTournoi() {
  this.router.navigate(['/creertournoi']) ;
  }

  onDeleteTournoi(tournoi: Tournoi) {
    this.tournoiService.supprimerTournoi(tournoi) ;
    this.hideDelete() ;
  }

  onOpenTournoi(id: number) {
    this.router.navigate(['/gerertournoi', id]) ;
  }

  ngOnDestroy() {
    this.tournoiSubscription.unsubscribe() ;
  }

  onOpenRondes(id){
    this.router.navigate(['gererronde', id]);
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

  checkIfPermissionExists(){
    if (this.permissionService.checkIfPermissionExist(this.authService.getCurrentUser().email) !== true)
    {
      const newPermission = new Permission(this.authService.getCurrentUser().email, 1, 'player') ;
      this.permissionService.createPermission(newPermission) ;
    }
  }
}
