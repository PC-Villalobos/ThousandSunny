return {
	id = "01-sabana",
	eraId = "sabana",
	order = 1,
	title = "Sabana",
	goal = "Reach the acacia marker before stamina breaks.",
	mechanics = {
		primary = "runner",
		hazards = { "tall_grass", "dry_gully" },
		collectibles = { "memory_seed" },
		checkpoints = { "start", "acacia", "ridge" }
	},
	narrator = {
		"First body. First breath. Run before you explain.",
		"The skin remembers the path before the mind names it."
	},
	rewards = {
		freeSkin = "sendero_sabana",
		memory = "Primera carrera sobrevivida"
	}
}
