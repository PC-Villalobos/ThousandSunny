return {
	id = "02-piedra",
	eraId = "piedra",
	order = 2,
	title = "Piedra",
	goal = "Carry the first tool through the broken pass.",
	mechanics = {
		primary = "push_and_break",
		hazards = { "falling_rock", "narrow_pass" },
		collectibles = { "flint_piece" },
		checkpoints = { "start", "workshop", "pass" }
	},
	narrator = {
		"A tool is a promise: the world can be changed.",
		"Weight teaches timing."
	},
	rewards = {
		freeSkin = "tallador_piedra",
		memory = "La herramienta cambia el cuerpo"
	}
}
