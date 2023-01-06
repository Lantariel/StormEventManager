import { Component, OnInit } from '@angular/core';
import {Tournoi} from '../../models/tournoi.model';
import {ActivatedRoute, Route, Router} from '@angular/router';
import {TournoiService} from '../../services/tournoi.service';
import {Joueur} from '../../models/joueur.model';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Match} from '../../models/match.model';
import {AuthService} from '../../services/auth.service';
import {HttpClient} from '@angular/common/http';
import {browser} from 'protractor';
import {JoueurService} from '../../services/joueur.service';
import {search} from 'scryfall-client/dist/api-routes/cards';

@Component({
  selector: 'app-gerer-joueurs',
  templateUrl: './gerer-joueurs.component.html',
  styleUrls: ['./gerer-joueurs.component.scss']
})

export class GererJoueursComponent implements OnInit {

  tournoi: Tournoi; // Le tournoi sur lequel on travaille
  currentTournamentIndex: number; // Index dans la base du tournoi en cours

  joueursDuTournoi: Joueur[] ;
  playerFocus: number ;

  chercherJoueur: FormGroup ;
  assignToTable: FormGroup ;
  formDecklist: FormGroup ;
  formCommander: FormGroup ;
  formPartner: FormGroup ;
  formAddPlayer: FormGroup ;

  infoMsg: string ;
  errorMsg ;
  displayInfoMsg: boolean ;
  displayErrorMsg: boolean ;
  displayToPlayers: boolean ;
  displayCommanderImg: boolean ;
  dislpayAddPlayerPannel: boolean ;

  timeout: any = null ;
  commanderAutocomplete: any[] ;
  partnerAutocomplete: any[] ;
  searchResult: any ;
  urlResult: any ;
  searchPlayerResult: Joueur[] ;

  constructor(private route: ActivatedRoute,
              private tournoiService: TournoiService,
              private joueurService: JoueurService,
              private formBuilder: FormBuilder,
              private authService: AuthService,
              private http: HttpClient,
              private router: Router) {
  }

  ngOnInit(): void {

    this.tournoi = new Tournoi('', '', +'') ;
    this.currentTournamentIndex = this.route.snapshot.params.id;

    this.tournoiService.getTournois();
    this.tournoiService.emitTournois();

    this.joueurService.getPlayers() ;
    this.joueurService.emitPlayers() ;

    this.tournoiService.getSingleTournoi(this.currentTournamentIndex).then(
      (tournoi: Tournoi) => {
        this.tournoi = tournoi ;
        this.joueursDuTournoi = this.tournoiService.getStandings(this.tournoi.registeredPlayers) ;
      }) ;

    this.playerFocus = -1 ;
    this.displayInfoMsg = false ;
    this.displayErrorMsg = false ;
    this.displayToPlayers = true ;
    this.displayCommanderImg = true ;
    this.dislpayAddPlayerPannel = false ;

    this.commanderAutocomplete = [] ;
    this.partnerAutocomplete = [] ;
    this.searchPlayerResult = [] ;

    this.initForm() ;
  }

  initForm(){
    this.chercherJoueur = this.formBuilder.group({
      search: ['', Validators.required]
    }) ;

    this.assignToTable = this.formBuilder.group({
      table: ['', Validators.required]
    }) ;

    this.formDecklist = this.formBuilder.group({
      decklist: ['', Validators.required]
    }) ;

    this.formCommander = this.formBuilder.group({
      commander: ['', Validators.required]
    }) ;

    this.formPartner = this.formBuilder.group({
      partner: ['', Validators.required]
    }) ;

    this.formAddPlayer = this.formBuilder.group({
      playerid: ['', Validators.required]
    }) ;
  }

  onBackToRound(){
    if (this.tournoi.step === 'rounds')
    { this.router.navigate(['gererronde', this.currentTournamentIndex]); }
    else
    { this.router.navigate(['finalmatches', this.currentTournamentIndex]); }
  }

  matchResearch(id: number){

    const research = this.chercherJoueur.get('search').value ;

    if (research === '')
    { return true ; }

    else
    {
     return this.joueursDuTournoi[id].firstName.toLowerCase().search(research) !== -1
       || this.joueursDuTournoi[id].lastName.toLowerCase().search(research) !== -1 ;
    }
  }

  setFocusPlayer(id: number){
    this.playerFocus = id ;
    this.infoMsg = null ;
  }

  getRealPenalties(pId: number){
    let warnings = 0 ;

    for (let i = 0 ; i < this.joueursDuTournoi[pId].warnings.length ; i++)
    {
      if (this.joueursDuTournoi[pId].warnings[i].penaltyType !== 'none')
      { warnings++ ; }
    }
    return warnings ;
  }

  getHistory(pFocus: number){
    const idInEvent = this.findPlayerInEvent(pFocus) ;
    const foundMatches: Match[] = [];
    let result: string[] = [] ;
    let playingAt: number ;

    for (let i = 0 ; i < this.tournoi.rondes.length - 1; i++)
    {
      for (let y = 0 ; y < this.tournoi.rondes[i].matches.length ; y++)
      {
        if (this.tournoi.rondes[i].matches[y].joueur1.playerIndexInEvent === idInEvent || this.tournoi.rondes[i].matches[y].joueur2.playerIndexInEvent === idInEvent)
        { foundMatches.push(this.tournoi.rondes[i].matches[y]) ; }
      }
    }

    for (let i = 0 ; i < foundMatches.length ; i++)
    {
      if (foundMatches[i].joueur1.playerID === this.tournoi.registeredPlayers[idInEvent].playerID)
      { playingAt = 1 ; }
      else
      { playingAt = 2 ; }

      if (playingAt === 1 && foundMatches[i].scoreJ1 > foundMatches[i].scoreJ2)
      { result.push('Victoire ' + foundMatches[i].scoreJ1 + ' - ' + foundMatches[i].scoreJ2 + ' contre ' + foundMatches[i].joueur2.firstName + ' ' + foundMatches[i].joueur2.lastName); }
      else if (playingAt === 2 && foundMatches[i].scoreJ2 > foundMatches[i].scoreJ1)
      { result.push('Victoire ' + foundMatches[i].scoreJ2 + ' - ' + foundMatches[i].scoreJ1 + ' contre ' + foundMatches[i].joueur1.firstName + ' ' + foundMatches[i].joueur1.lastName); }
      else if (playingAt === 1 && foundMatches[i].scoreJ2 > foundMatches[i].scoreJ1)
      { result.push('Défaite ' + foundMatches[i].scoreJ1 + ' - ' + foundMatches[i].scoreJ2 + ' contre ' + foundMatches[i].joueur2.firstName + ' ' + foundMatches[i].joueur2.lastName); }
      else if (playingAt === 2 && foundMatches[i].scoreJ2 < foundMatches[i].scoreJ1)
      { result.push('Défaite ' + foundMatches[i].scoreJ2 + ' - ' + foundMatches[i].scoreJ1 + ' contre ' + foundMatches[i].joueur1.firstName + ' ' + foundMatches[i].joueur1.lastName); }
      else if (playingAt === 1 && foundMatches[i].scoreJ2 === foundMatches[i].scoreJ1)
      { result.push('Egalité ' + foundMatches[i].scoreJ1 + ' - ' + foundMatches[i].scoreJ2 + ' contre ' + foundMatches[i].joueur2.firstName + ' ' + foundMatches[i].joueur2.lastName); }
      else if (playingAt === 2 && foundMatches[i].scoreJ2 === foundMatches[i].scoreJ1)
      { result.push('Egalité ' + foundMatches[i].scoreJ2 + ' - ' + foundMatches[i].scoreJ1 + ' contre ' + foundMatches[i].joueur1.firstName + ' ' + foundMatches[i].joueur1.lastName); }
    }
    return result ;
  }

  findPlayerInEvent(pFocus: number){
    let idInEvent: number ;
    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      if (this.tournoi.registeredPlayers[i].playerID === this.joueursDuTournoi[pFocus].playerID)
      {
        idInEvent = i ;
        i = this.tournoi.registeredPlayers.length ;
      }
    }
    return idInEvent ;
  }

  onAssignToTable(){
    let fixedTable = this.assignToTable.get('table').value ;

    if (+fixedTable < 0 || +fixedTable > this.tournoi.currentMatches.length - 1)
    { fixedTable = 'none' ; }


    if (!this.tournoiService.checkIfAPlayerIsalreadyAssignedToTable(this.tournoi.tournamentName, +fixedTable))
    {
      this.tournoiService.setFixedTable(this.tournoi.tournamentName, +this.joueursDuTournoi[this.playerFocus].playerIndexInEvent, fixedTable) ;
      this.infoMsg = this.joueursDuTournoi[this.playerFocus].firstName + ' ' + this.joueursDuTournoi[this.playerFocus].lastName + ' est assigné en table ' + fixedTable ;
      this.joueursDuTournoi[this.playerFocus].fixedOnTable = fixedTable ;
      this.displayErrorMsg = false ;
      this.displayInfoMsg = true ;
    }
    else
    {
      this.errorMsg = 'Un joueur est déjà assigné à cette table' ;
      this.displayInfoMsg = false ;
      this.displayErrorMsg = true ;
    }

    this.assignToTable.reset() ;
  }

  onRemoveFixedTable(pId: number){
    this.tournoiService.removeFixedTable(this.tournoi.tournamentName, +this.joueursDuTournoi[this.playerFocus].playerIndexInEvent) ;
    this.joueursDuTournoi[this.playerFocus].fixedOnTable = 'none' ;
  }

  onDropPlayer(pfocus: number){
    const playerId = this.findPlayerInEvent(pfocus) ;
    this.tournoiService.dropPlayer(this.tournoi.tournamentName, playerId) ;
    this.joueursDuTournoi[pfocus].status = 'dropped' ;
  }

  onRehabPlayer(pfocus: number){
    const playerId = this.findPlayerInEvent(pfocus) ;
    this.tournoiService.rehabPlayer(this.tournoi.tournamentName, playerId) ;
    this.joueursDuTournoi[pfocus].status = 'active' ;
  }

  togleDisplayToPlayers(){
    this.displayToPlayers = this.displayToPlayers !== true;
  }

  onOpenDisplayInfos(){
    this.router.navigate(['afficherinfos', this.currentTournamentIndex]);
  }

  onSetDecklist(pfocus: number){
    const playerId = this.findPlayerInEvent(pfocus) ;
    const decklist = this.formDecklist.get('decklist').value ;
    this.tournoiService.setDecklist(this.tournoi.tournamentId, playerId, decklist) ;
    this.joueursDuTournoi[this.playerFocus].decklist = decklist ;
    //this.tournoiService.updateStandingFromScratch(this.tournoi.tournamentName) ;
    this.formDecklist.reset() ;
  }

  onSetCommander(pfocus: number){
    const pId = this.findPlayerInEvent(pfocus) ;
    let commander: string = this.formCommander.get('commander').value ;
    let commanderName: string = commander ;
    let commanderForImg: string = '' ;

    for (let i = 0 ; i < commander.length ; i++)
    {
     if (commander[i] === '/')
     {
       let cut = i + 2 ;
       commanderForImg = commander.replace(/\/\//, '') ;
       commanderForImg = commanderForImg.replace(/\s+/g, '-') ;

       for (let z = 0 ; z < 5 ; z++)
       { commanderForImg = commanderForImg.replace(',', '') ; }

       commanderName = commander.slice(0, commander.length - cut) ;
       i = commander.length ;
     }
    }

    let commanderForUrl = commanderName.replace(/\s+/g, '-') ;
    let url: any = '' ;
    let requestUrl = 'https://api.scryfall.com/cards/search?q=' + commanderForUrl ;

    this.http.get(requestUrl).subscribe(urlResult => {
      this.urlResult = urlResult ;
      this.tournoi.registeredPlayers[pId].commander = commanderName ;
      this.joueursDuTournoi[pfocus].commander = commanderName ;
      this.tournoiService.setCommander(this.tournoi.tournamentId, pId, commanderName, url, 1) ;
      this.setCmdImg(pfocus, pId, commanderForUrl) ;
      this.formCommander.reset() ;
    }) ;
  }

  setCmdImg(pfocus: number, pId: number, cmd: string){

    let url: any = '' ;
    let requestUrl = 'https://api.scryfall.com/cards/search?q=' + cmd ;
    console.log('img ' + cmd) ;
    this.http.get(requestUrl).subscribe(urlResult => {
      this.urlResult = urlResult ;
      url = this.urlResult.data[0]['image_uris']['art_crop'] ;
      this.tournoi.registeredPlayers[pId].commanderImgUrl = url ;
      this.joueursDuTournoi[pfocus].commanderImgUrl = url ;
      this.tournoiService.setCommanderImg(this.tournoi.tournamentId, pId, cmd, url, 1) ;
    }) ;
  }

  onSetPartner(pfocus: number){
    const pId = this.findPlayerInEvent(pfocus) ;
    let partner: string = this.formPartner.get('partner').value ;
    let partnerName: string = partner ;
    let partnerForImg: string = '' ;

    for (let i = 0 ; i < partner.length ; i++)
    {
      if (partner[i] === '/')
      {
        let cut = i + 2 ;
        partnerForImg = partner.replace(/\/\//, '') ;
        partnerForImg = partnerForImg.replace(/\s+/g, '-') ;

        for (let z = 0 ; z < 5 ; z++)
        { partnerForImg = partnerForImg.replace(',', '') ; }

        partnerName = partner.slice(0, partner.length - cut) ;
        i = partner.length ;
      }
    }

    let partnerForUrl = partnerName.replace(/\s+/g, '-') ;
    let url: any = '' ;
    let requestUrl = 'https://api.scryfall.com/cards/search?q=' + partnerForUrl ;

    this.http.get(requestUrl).subscribe(urlResult => {
      this.urlResult = urlResult ;
      this.tournoi.registeredPlayers[pId].partner = partnerName ;
      this.joueursDuTournoi[pfocus].partner = partnerName ;
      this.tournoiService.setPartner(this.tournoi.tournamentId, pId, partnerName, url, 1) ;
      this.setPnTImg(pfocus, pId, partnerForUrl) ;
      this.formPartner.reset() ;
    }) ;
  }

  setPnTImg(pfocus: number, pId: number, cmd: string){

    let url: any = '' ;
    let requestUrl = 'https://api.scryfall.com/cards/search?q=' + cmd ;
    console.log('img ' + cmd) ;
    this.http.get(requestUrl).subscribe(urlResult => {
      this.urlResult = urlResult ;
      url = this.urlResult.data[0]['image_uris']['art_crop'] ;
      this.tournoi.registeredPlayers[pId].partnerImgUrl = url ;
      this.joueursDuTournoi[pfocus].partnerImgUrl = url ;
      this.tournoiService.setPartnerImg(this.tournoi.tournamentId, pId, cmd, url, 1) ;
      this.joueursDuTournoi[pfocus] = this.tournoiService.tournois[this.tournoiService.findTournamentIdByName(this.tournoi.tournamentName)].currentStanding[pfocus] ;
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

  onKeySearchPartner(event: any) {
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(function () {
      if (event.keyCode != 13) {
        $this.executeListingPartner(event.target.value);
      }
    }, 1000);
  }

  executeListing(value: string) {
    this.commanderAutocomplete.splice(0, this.commanderAutocomplete.length) ;
    const research = this.formCommander.get('commander').value ;
    const request = 'https://api.scryfall.com/cards/search?q=' + research + '+is%3Aduelcommander';
    this.http.get(request).subscribe(requestResult => {
      this.searchResult = requestResult ;

      for (let i = 0 ; i < this.searchResult.data.length ; i++)
      { this.commanderAutocomplete.push(this.searchResult.data[i]['name']) ; }
    }) ;
  }

  executeListingPartner(value: string) {
    this.partnerAutocomplete.splice(0, this.partnerAutocomplete.length) ;
    const research = this.formPartner.get('partner').value ;
    const request = 'https://api.scryfall.com/cards/search?q=' + research + '+is%3Aduelcommander';
    this.http.get(request).subscribe(requestResult => {
      this.searchResult = requestResult ;

      for (let i = 0 ; i < this.searchResult.data.length ; i++)
      { this.partnerAutocomplete.push(this.searchResult.data[i]['name']) ; }
    }) ;
  }

  togleDisplayCommanderImg(){
    this.displayCommanderImg = this.displayCommanderImg !== true ;
  }

  deleteCommander(pfocus: number){
    const pId = this.findPlayerInEvent(pfocus) ;
    this.deletePartner(pfocus) ;
    this.joueursDuTournoi[pfocus].commander = 'x' ;
    this.joueursDuTournoi[pfocus].commanderImgUrl = 'x' ;
    this.joueursDuTournoi[pfocus].partner = '' ;
    this.joueursDuTournoi[pfocus].partnerImgUrl = null ;
    this.tournoiService.resetCommander(this.tournoi.tournamentId, pId) ;

  }

  deletePartner(pfocus: number){
    const pId = this.findPlayerInEvent(pfocus) ;
    this.joueursDuTournoi[pfocus].partner = '' ;
    this.joueursDuTournoi[pfocus].partnerImgUrl = null ;
    this.tournoiService.resetPartner(this.tournoi.tournamentId, pId) ;
  }

  checkIfPlayerIsFixed(pId: number){
    return this.tournoi.currentStanding[pId].fixedOnTable !== 'none';
  }

  togleDisplayAddPlayerPannel(){
    this.dislpayAddPlayerPannel = this.dislpayAddPlayerPannel !== true ;
  }

  searchPlayer(){
    const searchValue: any = this.formAddPlayer.get('playerid').value ;
    this.searchPlayerResult = [] ;

    if (searchValue === '')
    { this.searchPlayerResult = [] ; }
    else
    {
      for (let i = 0 ; i < this.joueurService.joueurs.length ; i++)
      {
        if (this.joueurService.joueurs[i].firstName.toLowerCase().search(searchValue) > -1 ||
          this.joueurService.joueurs[i].lastName.toLowerCase().search(searchValue) > -1 ||
          this.joueurService.joueurs[i].playerID.toLowerCase().search(searchValue) > -1)
        {
          if (!this.isAlreadyRegistered(this.joueurService.joueurs[i].playerID))
          { this.searchPlayerResult.push(this.joueurService.joueurs[i]) ; }
        }
      }
    }
  }

  isAlreadyRegistered(playerid: string){
    let found = false ;
    for (let i = 0 ; i < this.tournoi.registeredPlayers.length ; i++)
    {
      if (playerid === this.tournoi.registeredPlayers[i].playerID)
      {
        found = true ;
        i = this.tournoi.registeredPlayers.length ;
      }
    }
    return found ;
  }

  addPlayerDuringEvent(player: Joueur){
    this.tournoiService.addPlayerDuringEvent(this.tournoi.tournamentName, player, this.tournoi.rondeEnCours - 1, 0) ;
    this.formAddPlayer.reset() ;
    this.searchPlayerResult = [] ;
    this.dislpayAddPlayerPannel = false ;
  }

  updateLocal(){
    this.tournoi.currentStanding = this.tournoiService.tournois[this.tournoiService.tournois[this.tournoiService.findTournamentIdByName(this.tournoi.tournamentName)].tournamentId].currentStanding ;
    this.tournoi.registeredPlayers = this.tournoiService.tournois[this.tournoiService.tournois[this.tournoiService.findTournamentIdByName(this.tournoi.tournamentName)].tournamentId].registeredPlayers ;
  }

}
