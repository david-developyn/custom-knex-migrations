import knex from 'knex';
import dotenv_json from 'dotenv-json';

dotenv_json();

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    },
    pool: {
        min: 0,
        max: 10,
    }
});



const database_definition = {
	bookings: [],
	trip_invites: [
		{
			name: 'booking_id',
			type: 'integer',
			type_options: null,
			nullable: false,
			references: 'bookings.id',
			on_delete: 'CASCADE',
			default_to: null
		},
		{
			name: 'email_address',
			type: 'text',
			type_options: null,
			nullable: false,
			references: null,
			on_delete: null,
			default_to: null
		},
		{
			name: 'created_at',
			type: 'timestamp',
			type_options: { useTz: false },
			nullable: false,
			references: null,
			on_delete: null,
			default_to: db.fn.now()
		},
	]
};

for (const [ table_name, table_definition ] of Object.entries(database_definition)) {
	if (!await db.schema.hasTable(table_name)) {
		await db.schema.createTable(table_name, (table) => table.increments().primary());
	}

	const existing_columns = [];
	for (const { name } of table_definition) {
		if (await db.schema.hasColumn(table_name, name)) {
			existing_columns.push(name);
		}
	}

	await db.schema.alterTable(table_name, async (table) => {
		for (const column of table_definition) {
			const column_builder = (existing_columns.includes(column.name)) ?
				table[column.type](column.name, column.type_options).alter() :
				table[column.type](column.name);

			if (column.nullable) {
				column_builder.nullable();
			} else {
				column_builder.notNullable();
			}

			if (column.references) {
				column_builder.references(column.references);
			}

			if (column.on_delete) {
				column_builder.onDelete(column.on_delete);
			}

			if (column.default_to) {
				column_builder.defaultTo(column.default_to);
			}
		}
	});

}


console.log(await db('trip_invites'));