export class Penalty{

  public penaltyType: string ;
  public penaltySanction: string ;
  public penaltyDesc: string ;
  public roundNumber: number ;
  public judge: string ;

  constructor(type, sanction, desc, round, judge) {
    this.penaltyType = type ;
    this.penaltySanction = sanction ;
    this.penaltyDesc = desc ;
    this.roundNumber = round ;
    this.judge = judge ;
  }
}
