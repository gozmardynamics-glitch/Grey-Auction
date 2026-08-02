import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSellerTables1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // CREATE ENUMS (idempotent — safe to re-run)
    // ==========================================

    // Business Type Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE seller_business_type_enum AS ENUM (
          'INDIVIDUAL',
          'SOLE_PROPRIETORSHIP',
          'LLC',
          'CORPORATION',
          'PARTNERSHIP'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Verification Status Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE seller_verification_status_enum AS ENUM (
          'PENDING',
          'UNDER_REVIEW',
          'APPROVED',
          'REJECTED',
          'SUSPENDED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Seller Status Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE seller_status_enum AS ENUM (
          'ACTIVE',
          'INACTIVE',
          'SUSPENDED',
          'BANNED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Payout Method Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE seller_payout_method_enum AS ENUM (
          'BANK_TRANSFER',
          'MOBILE_MONEY',
          'CRYPTO',
          'CHECK'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Document Type Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE document_type_enum AS ENUM (
          'BUSINESS_LICENSE',
          'TAX_CERTIFICATE',
          'ID_CARD',
          'PASSPORT',
          'PROOF_OF_ADDRESS',
          'BANK_STATEMENT',
          'CERTIFICATE_OF_INCORPORATION',
          'MEMORANDUM_OF_ASSOCIATION',
          'OTHER'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Document Verification Status Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE document_verification_status_enum AS ENUM (
          'PENDING',
          'UNDER_REVIEW',
          'APPROVED',
          'REJECTED',
          'EXPIRED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Payout Status Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payout_status_enum AS ENUM (
          'PENDING',
          'PROCESSING',
          'COMPLETED',
          'FAILED',
          'CANCELLED',
          'REVERSED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Review Status Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE review_status_enum AS ENUM (
          'ACTIVE',
          'HIDDEN',
          'FLAGGED',
          'REMOVED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Statistics Period Enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE statistics_period_enum AS ENUM (
          'DAILY',
          'WEEKLY',
          'MONTHLY',
          'QUARTERLY',
          'YEARLY'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ==========================================
    // CREATE SELLERS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'sellers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // User Link
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          // Business Information
          {
            name: 'business_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'business_type',
            type: 'seller_business_type_enum',
            default: "'INDIVIDUAL'",
          },
          {
            name: 'business_registration_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tax_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'business_description',
            type: 'text',
            isNullable: true,
          },
          // Contact Information
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Address
          {
            name: 'address_line1',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'address_line2',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'state',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '2',
            default: "'NG'",
          },
          // Verification
          {
            name: 'verification_status',
            type: 'seller_verification_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'verification_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verified_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rejected_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          // Financial
          {
            name: 'commission_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 10.0,
          },
          {
            name: 'payout_method',
            type: 'seller_payout_method_enum',
            isNullable: true,
          },
          {
            name: 'bank_account_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'NGN'",
          },
          // Performance Metrics
          {
            name: 'total_sales',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_products',
            type: 'int',
            default: 0,
          },
          {
            name: 'active_products',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_orders',
            type: 'int',
            default: 0,
          },
          {
            name: 'completed_orders',
            type: 'int',
            default: 0,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_reviews',
            type: 'int',
            default: 0,
          },
          // Status
          {
            name: 'status',
            type: 'seller_status_enum',
            default: "'INACTIVE'",
          },
          {
            name: 'suspension_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'suspended_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'suspended_by_id',
            type: 'uuid',
            isNullable: true,
          },
          // Settings
          {
            name: 'notifications_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'auto_accept_orders',
            type: 'boolean',
            default: false,
          },
          {
            name: 'business_hours',
            type: 'jsonb',
            isNullable: true,
          },
          // Metadata
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'internal_notes',
            type: 'text',
            isNullable: true,
          },
          // Timestamps
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for sellers table
    await queryRunner.createIndex(
      'sellers',
      new TableIndex({
        name: 'IDX_sellers_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'sellers',
      new TableIndex({
        name: 'IDX_sellers_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'sellers',
      new TableIndex({
        name: 'IDX_sellers_verification_status',
        columnNames: ['verification_status'],
      }),
    );

    await queryRunner.createIndex(
      'sellers',
      new TableIndex({
        name: 'IDX_sellers_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'sellers',
      new TableIndex({
        name: 'IDX_sellers_business_registration',
        columnNames: ['business_registration_number'],
      }),
    );

    // ==========================================
    // CREATE SELLER_DOCUMENTS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'seller_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'seller_id',
            type: 'uuid',
          },
          {
            name: 'document_type',
            type: 'document_type_enum',
          },
          {
            name: 'document_number',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          // File Information
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'file_size',
            type: 'int',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'file_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          // Verification
          {
            name: 'verification_status',
            type: 'document_verification_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'verification_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verified_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          // Validity
          {
            name: 'issue_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'date',
            isNullable: true,
          },
          // Metadata
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          // Timestamps
          {
            name: 'uploaded_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['seller_id'],
            referencedTableName: 'sellers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for seller_documents table
    await queryRunner.createIndex(
      'seller_documents',
      new TableIndex({
        name: 'IDX_seller_documents_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    await queryRunner.createIndex(
      'seller_documents',
      new TableIndex({
        name: 'IDX_seller_documents_type',
        columnNames: ['document_type'],
      }),
    );

    await queryRunner.createIndex(
      'seller_documents',
      new TableIndex({
        name: 'IDX_seller_documents_verification_status',
        columnNames: ['verification_status'],
      }),
    );

    await queryRunner.createIndex(
      'seller_documents',
      new TableIndex({
        name: 'IDX_seller_documents_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Continue in next part...
    // ==========================================
    // CREATE SELLER_PAYOUTS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'seller_payouts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'seller_id',
            type: 'uuid',
          },
          // Amount Information
          {
            name: 'gross_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'commission_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'net_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'NGN'",
          },
          {
            name: 'commission_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          // Payout Details
          {
            name: 'status',
            type: 'payout_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'payout_method',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'payout_details',
            type: 'jsonb',
          },
          {
            name: 'reference_number',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Period
          {
            name: 'period_start',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'period_end',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'orders_count',
            type: 'int',
            default: 0,
          },
          // Processing
          {
            name: 'processed_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'processing_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
          // Timestamps
          {
            name: 'requested_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'approved_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'processing_started_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          // Metadata
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['seller_id'],
            referencedTableName: 'sellers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for seller_payouts table
    await queryRunner.createIndex(
      'seller_payouts',
      new TableIndex({
        name: 'IDX_seller_payouts_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    await queryRunner.createIndex(
      'seller_payouts',
      new TableIndex({
        name: 'IDX_seller_payouts_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'seller_payouts',
      new TableIndex({
        name: 'IDX_seller_payouts_reference',
        columnNames: ['reference_number'],
      }),
    );

    await queryRunner.createIndex(
      'seller_payouts',
      new TableIndex({
        name: 'IDX_seller_payouts_requested_at',
        columnNames: ['requested_at'],
      }),
    );

    await queryRunner.createIndex(
      'seller_payouts',
      new TableIndex({
        name: 'IDX_seller_payouts_completed_at',
        columnNames: ['completed_at'],
      }),
    );

    // ==========================================
    // CREATE SELLER_REVIEWS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'seller_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'seller_id',
            type: 'uuid',
          },
          {
            name: 'bidder_id',
            type: 'uuid',
          },
          {
            name: 'auction_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: true,
          },
          // Review Content
          {
            name: 'rating',
            type: 'int',
          },
          {
            name: 'comment',
            type: 'text',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          // Sub-ratings
          {
            name: 'communication_rating',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'product_quality_rating',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'shipping_speed_rating',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'packaging_rating',
            type: 'int',
            isNullable: true,
          },
          // Seller Response
          {
            name: 'response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responded_at',
            type: 'timestamp',
            isNullable: true,
          },
          // Status
          {
            name: 'status',
            type: 'review_status_enum',
            default: "'ACTIVE'",
          },
          {
            name: 'flag_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'flagged_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'flagged_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_verified_purchase',
            type: 'boolean',
            default: false,
          },
          // Helpfulness
          {
            name: 'helpful_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'not_helpful_count',
            type: 'int',
            default: 0,
          },
          // Images
          {
            name: 'images',
            type: 'jsonb',
            isNullable: true,
          },
          // Metadata
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          // Timestamps
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['seller_id'],
            referencedTableName: 'sellers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for seller_reviews table
    await queryRunner.createIndex(
      'seller_reviews',
      new TableIndex({
        name: 'IDX_seller_reviews_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    await queryRunner.createIndex(
      'seller_reviews',
      new TableIndex({
        name: 'IDX_seller_reviews_bidder_id',
        columnNames: ['bidder_id'],
      }),
    );

    await queryRunner.createIndex(
      'seller_reviews',
      new TableIndex({
        name: 'IDX_seller_reviews_auction_id',
        columnNames: ['auction_id'],
      }),
    );

    await queryRunner.createIndex(
      'seller_reviews',
      new TableIndex({
        name: 'IDX_seller_reviews_rating',
        columnNames: ['rating'],
      }),
    );

    await queryRunner.createIndex(
      'seller_reviews',
      new TableIndex({
        name: 'IDX_seller_reviews_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'seller_reviews',
      new TableIndex({
        name: 'IDX_seller_reviews_created_at',
        columnNames: ['created_at'],
      }),
    );

    // ==========================================
    // CREATE SELLER_STATISTICS TABLE
    // ==========================================

    await queryRunner.createTable(
      new Table({
        name: 'seller_statistics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'seller_id',
            type: 'uuid',
          },
          // Period
          {
            name: 'period_type',
            type: 'statistics_period_enum',
          },
          {
            name: 'period_start',
            type: 'date',
          },
          {
            name: 'period_end',
            type: 'date',
          },
          // Sales Metrics
          {
            name: 'total_sales',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'gross_revenue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'commission_paid',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'net_revenue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_orders',
            type: 'int',
            default: 0,
          },
          {
            name: 'completed_orders',
            type: 'int',
            default: 0,
          },
          {
            name: 'cancelled_orders',
            type: 'int',
            default: 0,
          },
          {
            name: 'refunded_orders',
            type: 'int',
            default: 0,
          },
          // Product Metrics
          {
            name: 'products_listed',
            type: 'int',
            default: 0,
          },
          {
            name: 'products_sold',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_views',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_clicks',
            type: 'int',
            default: 0,
          },
          // Customer Metrics
          {
            name: 'unique_customers',
            type: 'int',
            default: 0,
          },
          {
            name: 'repeat_customers',
            type: 'int',
            default: 0,
          },
          {
            name: 'new_customers',
            type: 'int',
            default: 0,
          },
          // Review Metrics
          {
            name: 'reviews_received',
            type: 'int',
            default: 0,
          },
          {
            name: 'average_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0,
          },
          {
            name: 'positive_reviews',
            type: 'int',
            default: 0,
          },
          {
            name: 'negative_reviews',
            type: 'int',
            default: 0,
          },
          // Performance Metrics
          {
            name: 'conversion_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'average_order_value',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'completion_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'cancellation_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'average_response_time_minutes',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          // Payout Metrics
          {
            name: 'payouts_requested',
            type: 'int',
            default: 0,
          },
          {
            name: 'payouts_completed',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_payouts',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          // Timestamps
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'calculated_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['seller_id'],
            referencedTableName: 'sellers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for seller_statistics table
    await queryRunner.createIndex(
      'seller_statistics',
      new TableIndex({
        name: 'IDX_seller_statistics_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    await queryRunner.createIndex(
      'seller_statistics',
      new TableIndex({
        name: 'IDX_seller_statistics_period_type',
        columnNames: ['period_type'],
      }),
    );

    await queryRunner.createIndex(
      'seller_statistics',
      new TableIndex({
        name: 'IDX_seller_statistics_period_start',
        columnNames: ['period_start'],
      }),
    );

    await queryRunner.createIndex(
      'seller_statistics',
      new TableIndex({
        name: 'IDX_seller_statistics_period_end',
        columnNames: ['period_end'],
      }),
    );

    // Create unique index for seller + period
    await queryRunner.createIndex(
      'seller_statistics',
      new TableIndex({
        name: 'IDX_seller_statistics_unique_period',
        columnNames: ['seller_id', 'period_type', 'period_start'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('seller_statistics', true);
    await queryRunner.dropTable('seller_reviews', true);
    await queryRunner.dropTable('seller_payouts', true);
    await queryRunner.dropTable('seller_documents', true);
    await queryRunner.dropTable('sellers', true);

    await queryRunner.query(`DROP TYPE IF EXISTS statistics_period_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS review_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payout_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_verification_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS seller_payout_method_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS seller_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS seller_verification_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS seller_business_type_enum;`);
  }
}
