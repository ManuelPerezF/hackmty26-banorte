import { Controller, Get } from '@nestjs/common';
import { CuentasService } from '../services/cuentas.service';

@Controller('account')
export class CuentasController {
  constructor(private readonly accounts: CuentasService) {}
  @Get() summary() { return this.accounts.summary(); }
}
