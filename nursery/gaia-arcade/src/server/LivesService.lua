local Players = game:GetService("Players")

local LivesService = {}

LivesService.Config = {
	maxLives = 5,
	startingLives = 5,
	regenSeconds = 10 * 60
}

local stateByUserId = {}

local function now()
	return os.time()
end

local function defaultState()
	return {
		lives = LivesService.Config.startingLives,
		maxLives = LivesService.Config.maxLives,
		nextRegenAt = nil,
		gameOverAt = nil
	}
end

local function applyRegen(state, atTime)
	if state.lives >= state.maxLives then
		state.nextRegenAt = nil
		return
	end

	if not state.nextRegenAt then
		state.nextRegenAt = atTime + LivesService.Config.regenSeconds
		return
	end

	while state.nextRegenAt and atTime >= state.nextRegenAt and state.lives < state.maxLives do
		state.lives += 1
		state.nextRegenAt += LivesService.Config.regenSeconds
	end

	if state.lives >= state.maxLives then
		state.nextRegenAt = nil
	end
end

function LivesService.GetState(player)
	local userId = player.UserId
	if not stateByUserId[userId] then
		stateByUserId[userId] = defaultState()
	end

	local state = stateByUserId[userId]
	applyRegen(state, now())
	return state
end

function LivesService.GetSnapshot(player)
	local state = LivesService.GetState(player)
	return {
		lives = state.lives,
		maxLives = state.maxLives,
		nextRegenAt = state.nextRegenAt,
		gameOverAt = state.gameOverAt,
		canPlay = state.lives > 0
	}
end

function LivesService.SpendLife(player, reason)
	local state = LivesService.GetState(player)
	if state.lives <= 0 then
		state.gameOverAt = state.gameOverAt or now()
		return false, LivesService.GetSnapshot(player)
	end

	state.lives -= 1
	if state.lives <= 0 then
		state.lives = 0
		state.gameOverAt = now()
	end

	if state.lives < state.maxLives and not state.nextRegenAt then
		state.nextRegenAt = now() + LivesService.Config.regenSeconds
	end

	state.lastSpendReason = reason or "unknown"
	return true, LivesService.GetSnapshot(player)
end

function LivesService.GrantLives(player, amount, reason)
	local state = LivesService.GetState(player)
	state.lives = math.clamp(state.lives + amount, 0, state.maxLives)
	state.gameOverAt = nil
	state.lastGrantReason = reason or "grant"

	if state.lives >= state.maxLives then
		state.nextRegenAt = nil
	elseif not state.nextRegenAt then
		state.nextRegenAt = now() + LivesService.Config.regenSeconds
	end

	return LivesService.GetSnapshot(player)
end

function LivesService.ResetForRun(player)
	local state = LivesService.GetState(player)
	state.lives = LivesService.Config.startingLives
	state.nextRegenAt = nil
	state.gameOverAt = nil
	return LivesService.GetSnapshot(player)
end

function LivesService.Start()
	Players.PlayerRemoving:Connect(function(player)
		stateByUserId[player.UserId] = nil
	end)
end

return LivesService
