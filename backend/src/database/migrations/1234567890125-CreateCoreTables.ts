import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCoreTables1234567890125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // CREATE ENUMS
    // ==========================================

    // User Role Enum
    try {
      await queryRunner.query(`
        CREATE TYPE user_role_enum AS ENUM (
          'bidder',
          'seller',
          'admin'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) throw error;
    }

    // Auction Type Enum
    try {
      await queryRunner.query(`
        CREATE TYPE auction_type_enum AS ENUM (
          'direct_sale',
          'open_auction',
          'exclusive_auction'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) throw error;
    }

    // Product Status Enum
    try {
      await queryRunner.query(`
        CREATE TYPE product_status_enum AS ENUM (
          'draft',
          'pending_approval',
          'approved',
          'rejected',
          'active',
          'sold',
          'expired',
          'closed'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) throw error;
    }

    // Room Type Enum
    try {
      await queryRunner.query(`
        CREATE TYPE room_type_enum AS ENUM (
          'public',
          'private'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) throw error;
    }

    // Room Status Enum
    try {
      await queryRunner.query(`
        CREATE TYPE room_status_enum AS ENUM (
          'scheduled',
          'live',
          'closed',
          'cancelled',
          'settled'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) throw error;
    }

    // Ticket Status Enum
    try {
      await queryRunner.query(`
        CREATE TYPE ticket_status_enum AS ENUM (
          'open',
          'in_progress',
          'resolved',
          'closed'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) throw error;
    }

    // ==========================================
    // CREATE USERS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'user_role_enum',
            default: "'bidder'",
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'is_email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ==========================================
    // CREATE CATEGORIES TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'sub_categories',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'product_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ==========================================
    // CREATE BANNERS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'banners',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'link',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ==========================================
    // CREATE FAQS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'faqs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'question',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'answer',
            type: 'text',
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ==========================================
    // CREATE TICKETS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'ticket_status_enum',
            default: "'open'",
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'user_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'user_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'messages',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for tickets table
    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_tickets_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_tickets_user_id',
        columnNames: ['user_id'],
      }),
    );

    // ==========================================
    // CREATE CONTENT_PAGES TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'content_pages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'meta_description',
            type: 'varchar',
            length: '300',
            isNullable: true,
          },
          {
            name: 'meta_title',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ==========================================
    // CREATE ROOMS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'rooms',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'room_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'room_type_enum',
            default: "'public'",
          },
          {
            name: 'requires_deposit',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deposit_amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'requires_bid_fee',
            type: 'boolean',
            default: false,
          },
          {
            name: 'bid_fee_amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'timestamp with time zone',
          },
          {
            name: 'end_time',
            type: 'timestamp with time zone',
          },
          {
            name: 'duration',
            type: 'varchar',
            length: '50',
            default: "'7 days'",
          },
          {
            name: 'status',
            type: 'room_status_enum',
            default: "'scheduled'",
          },
          {
            name: 'allow_invite_code',
            type: 'boolean',
            default: false,
          },
          {
            name: 'invite_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
          },
          {
            name: 'product_ids',
            type: 'text',
            default: "''",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['created_by_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for rooms table
    await queryRunner.createIndex(
      'rooms',
      new TableIndex({
        name: 'IDX_rooms_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'rooms',
      new TableIndex({
        name: 'IDX_rooms_created_by_id',
        columnNames: ['created_by_id'],
      }),
    );

    // ==========================================
    // CREATE PRODUCTS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'starting_bid',
            type: 'decimal',
            precision: 18,
            scale: 2,
          },
          {
            name: 'current_bid',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'sub_category',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'specifications',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'end_time',
            type: 'timestamp with time zone',
          },
          {
            name: 'total_bids',
            type: 'int',
            default: 0,
          },
          {
            name: 'reserve_price',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'buy_now_price',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'has_reserve_price',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allow_buy_now',
            type: 'boolean',
            default: false,
          },
          {
            name: 'auction_duration',
            type: 'varchar',
            length: '50',
            default: "'7 days'",
          },
          {
            name: 'auction_type',
            type: 'auction_type_enum',
            default: "'open_auction'",
          },
          {
            name: 'status',
            type: 'product_status_enum',
            default: "'draft'",
          },
          {
            name: 'seller_id',
            type: 'uuid',
          },
          {
            name: 'approved_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['seller_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for products table
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    // ==========================================
    // CREATE BIDS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'bids',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'room_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'bidder_id',
            type: 'uuid',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
          },
          {
            name: 'is_auto_bid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_winning_bid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'accounting_journal_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['room_id'],
            referencedTableName: 'rooms',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
          new TableForeignKey({
            columnNames: ['bidder_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for bids table
    await queryRunner.createIndex(
      'bids',
      new TableIndex({
        name: 'IDX_bids_product_id',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'bids',
      new TableIndex({
        name: 'IDX_bids_bidder_id',
        columnNames: ['bidder_id'],
      }),
    );

    // ==========================================
    // CREATE ROOM_PARTICIPANTS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'room_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'room_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'has_paid_deposit',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'joined_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['room_id'],
            referencedTableName: 'rooms',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('room_participants', true);
    await queryRunner.dropTable('bids', true);
    await queryRunner.dropTable('products', true);
    await queryRunner.dropTable('rooms', true);
    await queryRunner.dropTable('content_pages', true);
    await queryRunner.dropTable('tickets', true);
    await queryRunner.dropTable('faqs', true);
    await queryRunner.dropTable('banners', true);
    await queryRunner.dropTable('categories', true);
    await queryRunner.dropTable('users', true);

    await queryRunner.query(`DROP TYPE IF EXISTS ticket_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS room_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS room_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS product_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS auction_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum;`);
  }
}
