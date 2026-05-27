import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReadingMediaMetadataId1779851000000 implements MigrationInterface {
  name = 'AddReadingMediaMetadataId1779851000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "metadataId" varchar`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b187fea587b79fe6518a789b62" ON "media" ("metadataId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70a58c3bfd113bf699ab37a46d" ON "media" ("metadataId", "mediaType")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_70a58c3bfd113bf699ab37a46d"`);
    await queryRunner.query(`DROP INDEX "IDX_b187fea587b79fe6518a789b62"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "metadataId"`);
  }
}
