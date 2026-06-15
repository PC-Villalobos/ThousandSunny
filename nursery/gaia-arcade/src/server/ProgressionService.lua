local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("GaiaArcade"):WaitForChild("Shared")
local Eras = require(Shared:WaitForChild("Eras"))
local Skins = require(Shared:WaitForChild("Skins"))

local ProgressionService = {}

local progressByUserId = {}

local function defaultProgress()
	return {
		currentLevelId = Eras.getFirstLevelId(),
		checkpointId = "start",
		completedLevels = {},
		unlockedSkins = {},
		selectedSkinId = nil
	}
end

local function getProgress(player)
	local userId = player.UserId
	if not progressByUserId[userId] then
		progressByUserId[userId] = defaultProgress()
	end

	return progressByUserId[userId]
end

local function listKeys(map)
	local values = {}
	for key, enabled in pairs(map) do
		if enabled then
			table.insert(values, key)
		end
	end
	table.sort(values)
	return values
end

function ProgressionService.GetSnapshot(player)
	local progress = getProgress(player)
	local level = Eras.getSeedLevel(progress.currentLevelId)
	local era = level and Eras.getEra(level.eraId) or nil

	return {
		currentLevelId = progress.currentLevelId,
		currentEraId = era and era.id or nil,
		currentEraTitle = era and era.title or nil,
		checkpointId = progress.checkpointId,
		completedLevels = listKeys(progress.completedLevels),
		unlockedSkins = listKeys(progress.unlockedSkins),
		selectedSkinId = progress.selectedSkinId
	}
end

function ProgressionService.SetCheckpoint(player, checkpointId)
	local progress = getProgress(player)
	progress.checkpointId = checkpointId
	return ProgressionService.GetSnapshot(player)
end

function ProgressionService.CompleteLevel(player, levelId)
	local progress = getProgress(player)
	local level = Eras.getSeedLevel(levelId)
	if not level then
		return false, ProgressionService.GetSnapshot(player)
	end

	progress.completedLevels[levelId] = true

	local era = Eras.getEra(level.eraId)
	if era and era.freeSkin and Skins.Free[era.freeSkin] then
		progress.unlockedSkins[era.freeSkin] = true
		progress.selectedSkinId = progress.selectedSkinId or era.freeSkin
	end

	for index, seedLevel in ipairs(Eras.SeedLevels) do
		if seedLevel.id == levelId and Eras.SeedLevels[index + 1] then
			progress.currentLevelId = Eras.SeedLevels[index + 1].id
			progress.checkpointId = "start"
			break
		end
	end

	return true, ProgressionService.GetSnapshot(player)
end

function ProgressionService.UnlockSkin(player, skinId)
	if not Skins.getSkin(skinId) then
		return false, ProgressionService.GetSnapshot(player)
	end

	local progress = getProgress(player)
	progress.unlockedSkins[skinId] = true
	progress.selectedSkinId = progress.selectedSkinId or skinId
	return true, ProgressionService.GetSnapshot(player)
end

function ProgressionService.RestartFromBeginning(player)
	progressByUserId[player.UserId] = defaultProgress()
	return ProgressionService.GetSnapshot(player)
end

function ProgressionService.Clear(player)
	progressByUserId[player.UserId] = nil
end

return ProgressionService
