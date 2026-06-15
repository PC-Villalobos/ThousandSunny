local Skins = {}

Skins.Free = {
	sendero_sabana = {
		id = "sendero_sabana",
		eraId = "sabana",
		title = "Sendero Sabana",
		unlock = { type = "level_complete", levelId = "01-sabana" },
		memory = "Primera carrera sobrevivida"
	},
	tallador_piedra = {
		id = "tallador_piedra",
		eraId = "piedra",
		title = "Tallador Piedra",
		unlock = { type = "level_complete", levelId = "02-piedra" },
		memory = "La herramienta cambia el cuerpo"
	},
	chispa_viva = {
		id = "chispa_viva",
		eraId = "fuego",
		title = "Chispa Viva",
		unlock = { type = "level_complete", levelId = "03-fuego" },
		memory = "El fuego se respeta antes de dominarlo"
	}
}

Skins.Premium = {
	guardian_sabana = {
		id = "guardian_sabana",
		eraId = "sabana",
		title = "Guardian Sabana",
		gamePassId = 0,
		memory = "Variante cosmetica: no altera vidas ni progreso"
	},
	obsidiana_pulida = {
		id = "obsidiana_pulida",
		eraId = "piedra",
		title = "Obsidiana Pulida",
		gamePassId = 0,
		memory = "Variante cosmetica: no altera checkpoints"
	},
	llama_azul = {
		id = "llama_azul",
		eraId = "fuego",
		title = "Llama Azul",
		gamePassId = 0,
		memory = "Variante cosmetica: no reduce dificultad"
	}
}

function Skins.getSkin(skinId)
	return Skins.Free[skinId] or Skins.Premium[skinId]
end

function Skins.isPremium(skinId)
	return Skins.Premium[skinId] ~= nil
end

return Skins
