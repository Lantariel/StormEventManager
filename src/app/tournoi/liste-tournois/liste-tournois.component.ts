import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {Tournoi} from '../../models/tournoi.model';
import {Subscription} from 'rxjs';
import {Ronde} from '../../models/ronde.model';
import {RondeService} from '../../services/ronde.service';

@Component({
  selector: 'app-liste-tournois',
  templateUrl: './liste-tournois.component.html',
  styleUrls: ['./liste-tournois.component.scss']
})
export class ListeTournoisComponent implements OnInit, OnDestroy {

  tournois: Tournoi[] ;
  tournoiSubscription: Subscription ;

  rondes: Ronde[] ;
  rondeSubscription: Subscription ;

  constructor(private tournoiService: TournoiService,
              private rondeService: RondeService ,
              private router: Router) { }

  ngOnInit(): void {
    this.tournoiSubscription = this.tournoiService.tournoisSubject.subscribe(
      (tournois: Tournoi[]) => {
        this.tournois = tournois ;
      }
    );
    this.tournoiService.getTournois() ;
    this.tournoiService.emitTournois() ;
  }

  onNewTournoi() {
  this.router.navigate(['/creertournoi']) ;
  }

  onDeleteTournoi(tournoi: Tournoi) {
    this.tournoiService.supprimerTournoi(tournoi) ;
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
}
