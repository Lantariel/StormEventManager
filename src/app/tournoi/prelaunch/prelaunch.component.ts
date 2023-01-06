import { Component, OnInit } from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {ActivatedRoute, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {AuthService} from '../../services/auth.service';
import {RondeService} from '../../services/ronde.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {bindNodeCallback} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-prelaunch',
  templateUrl: './prelaunch.component.html',
  styleUrls: ['./prelaunch.component.scss']
})
export class PrelaunchComponent implements OnInit {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  formResearch: FormGroup ;
  formDecklist: FormGroup ;

  toggleDecklistInput: number ;
  toggleCommanderInput: number ;

  searchResult: any ;
  commanderAutocomplete: any[] ;

  timeout: any = null ;
  urlResult: any ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private authService: AuthService,
              private formBuilder: FormBuilder,
              private http: HttpClient,
              private router: Router) { }

  ngOnInit(): void {
    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params['id'];

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
      }) ;

    this.toggleDecklistInput = -1 ;
    this.toggleCommanderInput = -1 ;

    this.commanderAutocomplete = [] ;

    this.initForm() ;
  }

  initForm(){
    this.formResearch = this.formBuilder.group({
      search: [''],
    });

    this.formDecklist = this.formBuilder.group({
      decklist: [''],
      commander: ['']
    }) ;
  }

  onGrantBye(id){
    this.tournoiService.grantBye(this.tournoi.tournamentId, id) ;
    this.tournoi.registeredPlayers[id].hasByes++ ;
  }

  onReduceBye(id){
    this.tournoiService.reduceBye(this.tournoi.tournamentId, id) ;
    this.tournoi.registeredPlayers[id].hasByes-- ;
  }

  matchReasearch(pId: number){
  const search = this.formResearch.get('search').value ;

  if (search === '') { return true ; }

  else
    {
      return this.tournoi.registeredPlayers[pId].firstName.toLowerCase().search(search) !== -1
        || this.tournoi.registeredPlayers[pId].lastName.toLowerCase().search(search) !== -1
        || this.tournoi.registeredPlayers[pId].nickname.toLowerCase().search(search) !== -1 ;
    }
  }

  onAddDecklist(pId: number){
    const decklist = this.formDecklist.get('decklist').value ;
    this.tournoi.registeredPlayers[pId].decklist = decklist ;
    this.tournoiService.setDecklist(this.tournoi.tournamentId, pId, decklist) ;
    this.toggleDecklistInput = -1 ;
  }

  onToggleDeckListInput(nb: number){
    this.toggleDecklistInput = nb ;
    this.formDecklist.reset() ;
  }

  onToggleCommander(nb: number){
    this.toggleCommanderInput = nb ;
    this.formDecklist.reset() ;
    this.commanderAutocomplete = [] ;
  }

  onLancerRondes(){
    this.tournoi.isLive = true ;
    this.tournoi.inscriptionsOuvertes = false ;
    this.tournoi.rondeEnCours = 1 ;
    this.tournoiService.beginTournament(this.currentTournamentIndex) ;
    this.router.navigate(['gererronde', this.currentTournamentIndex]) ;
  }

  onRetourAuxInscriptions(){
    this.router.navigate(['/gerertournoi', this.currentTournamentIndex]) ;
  }

  testRequest(){
    this.commanderAutocomplete.splice(0, this.commanderAutocomplete.length) ;
    const research = this.formDecklist.get('commander').value ;
    const request = 'https://api.scryfall.com/cards/search?q=' + research + '+is%3Acommander+f%3Aduel';
    this.http.get(request).subscribe(requestResult => {
      this.searchResult = requestResult ;

      for (let i = 0 ; i < this.searchResult.data.length ; i++)
      { this.commanderAutocomplete.push(this.searchResult.data[i]['name']) ; }
    }) ;
  }

  onSetCommander(pId: number){
    const commander = this.formDecklist.get('commander').value ;
    const commanderForUrl = commander.replace(/\s+/g, '+') ;
    let url: any = '' ;
    const requestUrl = 'https://api.scryfall.com/cards/search?q=' + commanderForUrl ;

    this.http.get(requestUrl).subscribe(urlResult => {
      this.urlResult = urlResult ;
      url = this.urlResult.data[0]['image_uris']['art_crop'] ;
      this.tournoi.registeredPlayers[pId].commander = commander ;
      this.tournoi.registeredPlayers[pId].commanderImgUrl = url ;
      this.tournoiService.setCommander(this.tournoi.tournamentId, pId, commander, url) ;
      this.setCmdImg(pId, commander) ;
    }) ;

    this.onToggleCommander(-1) ;
  }

  setCmdImg(pId: number, cmd: string): void{

    let url: any = '' ;
    const requestUrl = 'https://api.scryfall.com/cards/search?q=' + cmd ;
    this.http.get(requestUrl).subscribe(urlResult => {
      this.urlResult = urlResult ;
      url = this.urlResult.data[0]['image_uris']['art_crop'] ;
      this.tournoi.registeredPlayers[pId].commanderImgUrl = url ;
      this.tournoiService.setCommanderImg(this.tournoi.tournamentId, pId, cmd, url) ;
    }) ;
  }

  onKeySearch(event: any) {
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(function () {
      if (event.keyCode != 13) {
        $this.executeListing(event.target.value);
      }
    }, 1000);
  }

  executeListing(value: string) {
    this.commanderAutocomplete.splice(0, this.commanderAutocomplete.length) ;
    const research = this.formDecklist.get('commander').value ;
    const request = 'https://api.scryfall.com/cards/search?q=' + research + '+is%3Aduelcommander';
    this.http.get(request).subscribe(requestResult => {
      this.searchResult = requestResult ;

      for (let i = 0 ; i < this.searchResult.data.length ; i++)
      { this.commanderAutocomplete.push(this.searchResult.data[i]['name']) ; }
    }) ;
  }
}

