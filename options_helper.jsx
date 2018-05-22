// TODO: These must already be a thing?

class OptionsHelper {
	static toArray( options ) {
		return options.map( option => { return option.value; } );
	}

	static fromArray( values ) {
		return values.map(
			( key ) => {
				return {
					label: key,
					value: key
				};
			} );
	}
}

export default OptionsHelper;
