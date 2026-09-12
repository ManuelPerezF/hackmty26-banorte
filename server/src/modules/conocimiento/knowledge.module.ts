import {
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { KnowledgeService } from "./knowledge.service";

@Controller("knowledge/documents")
class KnowledgeController {
  constructor(private readonly db: PrismaService) {}

  @Get(":id/file")
  async file(@Param("id", new ParseUUIDPipe()) id: string) {
    const document = await this.db.knowledgeDocument.findUnique({ where: { id } });
    if (
      !document ||
      basename(document.filename) !== document.filename ||
      !/^[a-z0-9][a-z0-9-]*\.pdf$/.test(document.filename)
    )
      throw new NotFoundException();
    const bytes = await readFile(
      resolve(__dirname, "../../../knowledge/documents", document.filename),
    ).catch(() => {
      throw new NotFoundException();
    });
    return new StreamableFile(bytes, {
      type: "application/pdf",
      disposition: `inline; filename="${document.filename}"`,
    });
  }
}

@Module({
  imports: [DatabaseModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
