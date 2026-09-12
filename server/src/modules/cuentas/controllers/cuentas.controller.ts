import { CurrentUser, Identity } from "../../autenticacion/auth.types";
import { Controller, Get } from "@nestjs/common";
import { CuentasService } from "../services/cuentas.service";

@Controller("account")
export class CuentasController {
  constructor(private readonly accounts: CuentasService) {}
  @Get() summary(@CurrentUser() identity: Identity) {
    return this.accounts.summary(identity);
  }
}
