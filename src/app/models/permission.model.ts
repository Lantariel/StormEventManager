export class Permission{
  public associatedMail: string ;
  public associatedPermLevel: number ;
  public associatedRole: string ;

  constructor(mail, perm, role) {
    this.associatedMail = mail ;
    this.associatedPermLevel = perm ;
    this.associatedRole = role ;
  }
}
