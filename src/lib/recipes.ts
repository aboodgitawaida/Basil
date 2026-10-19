import { covers, daysLeft, isGoingOff, type Item } from './schema'

/** One thing a recipe needs. `item` is matched loosely against what is in the
 *  kitchen; "a|b" means either will do. `count` is for things counted one by
 *  one (3 eggs), so two eggs in the fridge is not enough for an omelette. */
export type Ingredient = {
  item: string
  qty: string
  count?: number
  optional?: boolean
}

export type Tag = 'vegetarian' | 'vegan' | 'breakfast'

export type Recipe = {
  name: string
  serves: number
  minutes: number
  /** per serving */
  kcal: number
  /** grams per serving */
  protein: number
  tags: Tag[]
  ingredients: Ingredient[]
  steps: string[]
  /** 'book' is built in, 'basil' came from the model */
  source?: 'book' | 'basil'
  /** the model's own note on why this one */
  note?: string
}

const i = (item: string, qty: string, extra: Partial<Ingredient> = {}): Ingredient => ({ item, qty, ...extra })
const opt = (item: string, qty: string): Ingredient => ({ item, qty, optional: true })
const V: Tag[] = ['vegetarian']
const VG: Tag[] = ['vegetarian', 'vegan']

/** The built-in book. Nutrition is per serving and rounded: good enough to
 *  choose between dinners, not to count macros to the gram. */
export const RECIPES: Recipe[] = [
  { name: 'Scrambled eggs on toast', serves: 1, minutes: 10, kcal: 430, protein: 24, tags: [...V, 'breakfast'],
    ingredients: [i('egg', '3 eggs', { count: 3 }), i('bread', '2 slices'), opt('butter', 'a knob'), opt('milk', 'a splash')],
    steps: ['Crack the eggs into a bowl with a splash of milk and a pinch of salt. Beat well.', 'Put the bread in the toaster.', 'Melt the butter in a pan over low heat. Pour in the eggs.', 'Stir slowly with a spatula, pulling the set egg in from the edges. Take off the heat while still a little wet.', 'Butter the toast and pile the eggs on top. Pepper.'] },
  { name: 'Cheese omelette', serves: 1, minutes: 10, kcal: 390, protein: 27, tags: [...V, 'breakfast'],
    ingredients: [i('egg', '3 eggs', { count: 3 }), i('cheese', '30g, grated'), opt('butter', 'a knob')],
    steps: ['Beat the eggs with salt and pepper.', 'Heat the butter in a non-stick pan until it foams.', 'Pour in the eggs and swirl. Pull the edges in as they set.', 'When the top is nearly set, scatter the cheese over one half.', 'Fold over and slide onto a plate.'] },
  { name: 'Cheese on toast', serves: 1, minutes: 8, kcal: 420, protein: 19, tags: V,
    ingredients: [i('bread', '2 slices'), i('cheese', '50g, sliced'), opt('ketchup|hot sauce|mustard', 'a dash')],
    steps: ['Heat the grill.', 'Toast one side of the bread under the grill.', 'Flip, cover the untoasted side with cheese.', 'Grill until bubbling and spotted brown. A dash of sauce if you like.'] },
  { name: 'Boiled eggs and soldiers', serves: 1, minutes: 10, kcal: 260, protein: 16, tags: [...V, 'breakfast'],
    ingredients: [i('egg', '2 eggs', { count: 2 }), i('bread', '1 slice'), opt('butter', 'for the toast')],
    steps: ['Bring a pan of water to the boil.', 'Lower the eggs in gently. 6 minutes for runny.', 'Toast and butter the bread, cut into strips.', 'Top the eggs and dip.'] },
  { name: 'Fried egg sandwich', serves: 1, minutes: 8, kcal: 380, protein: 18, tags: V,
    ingredients: [i('egg', '2 eggs', { count: 2 }), i('bread', '2 slices'), opt('ketchup|hot sauce', 'to taste'), opt('oil|butter', 'for frying')],
    steps: ['Heat a little oil in a frying pan.', 'Fry the eggs until the whites are set.', 'Butter the bread if you like.', 'Eggs in, sauce on, lid on. Eat over the sink.'] },
  { name: 'French toast', serves: 1, minutes: 15, kcal: 420, protein: 19, tags: [...V, 'breakfast'],
    ingredients: [i('bread', '2 thick slices'), i('egg', '2 eggs', { count: 2 }), i('milk', '50ml'), opt('butter', 'for frying'), opt('sugar|honey', 'to finish')],
    steps: ['Whisk the eggs and milk in a shallow dish.', 'Soak each slice of bread for 20 seconds a side.', 'Fry in butter over medium heat, 2–3 minutes a side, until golden.', 'Finish with sugar or honey.'] },
  { name: 'Pancakes', serves: 2, minutes: 20, kcal: 330, protein: 12, tags: [...V, 'breakfast'],
    ingredients: [i('flour', '100g'), i('egg', '1 egg', { count: 1 }), i('milk', '250ml'), opt('butter|oil', 'for the pan'), opt('sugar|honey|jam', 'to serve')],
    steps: ['Whisk the flour, egg and half the milk to a smooth paste, then whisk in the rest.', 'Rest the batter for 5 minutes.', 'Heat a lightly greased pan. Pour in a thin layer and tilt to spread.', 'Cook a minute until it lifts, flip, 30 seconds more.', 'Serve with sugar, lemon, honey or jam.'] },
  { name: 'Porridge', serves: 1, minutes: 7, kcal: 310, protein: 13, tags: [...V, 'breakfast'],
    ingredients: [i('oat', '50g'), i('milk', '300ml'), opt('honey|sugar|jam', 'a spoonful'), opt('banana|apple|berry', 'to top')],
    steps: ['Put the oats and milk in a pan with a pinch of salt.', 'Bring to a simmer, stirring.', 'Cook 4–5 minutes until thick and creamy.', 'Top with honey and fruit.'] },
  { name: 'Overnight oats', serves: 1, minutes: 5, kcal: 340, protein: 15, tags: [...V, 'breakfast'],
    ingredients: [i('oat', '50g'), i('yoghurt', '150g'), opt('milk', 'a splash'), opt('apple|banana|berry|pear', 'chopped'), opt('honey', 'a drizzle')],
    steps: ['Stir the oats, yoghurt and a splash of milk in a jar.', 'Fold in the fruit.', 'Lid on, fridge overnight.', 'Honey on top in the morning.'] },
  { name: 'Yoghurt and fruit bowl', serves: 1, minutes: 3, kcal: 230, protein: 14, tags: [...V, 'breakfast'],
    ingredients: [i('yoghurt', '200g'), i('apple|banana|berry|pear|peach|mango', 'a handful, chopped'), opt('honey', 'a drizzle'), opt('granola|oat|nut', 'a sprinkle')],
    steps: ['Spoon the yoghurt into a bowl.', 'Chop the fruit over the top.', 'Honey and a crunchy sprinkle.'] },
  { name: 'Cereal and milk', serves: 1, minutes: 2, kcal: 250, protein: 9, tags: [...V, 'breakfast'],
    ingredients: [i('cereal|granola', '1 bowl'), i('milk', '200ml'), opt('banana|berry', 'sliced')],
    steps: ['Cereal in the bowl.', 'Milk on the cereal. Not the other way round.'] },
  { name: 'Banana smoothie', serves: 1, minutes: 5, kcal: 280, protein: 12, tags: [...V, 'breakfast'],
    ingredients: [i('banana', '1 banana', { count: 1 }), i('milk', '250ml'), opt('yoghurt', '2 spoonfuls'), opt('honey|peanut butter', 'a spoonful'), opt('oat', 'a handful')],
    steps: ['Everything in the blender.', 'Blend until smooth.', 'Too thick, more milk. Too thin, more banana.'] },
  { name: 'Peanut butter toast', serves: 1, minutes: 4, kcal: 380, protein: 13, tags: VG,
    ingredients: [i('bread', '2 slices'), i('peanut butter', '2 tbsp'), opt('banana', 'sliced'), opt('honey', 'a drizzle')],
    steps: ['Toast the bread.', 'Spread thickly with peanut butter.', 'Banana slices on top if you have them.'] },
  { name: 'Toast and jam', serves: 1, minutes: 4, kcal: 300, protein: 7, tags: [...V, 'breakfast'],
    ingredients: [i('bread', '2 slices'), i('jam|honey|marmite', 'to spread'), opt('butter', 'to spread')],
    steps: ['Toast the bread.', 'Butter, then jam. Edge to edge.'] },
  { name: 'Bacon and eggs', serves: 1, minutes: 15, kcal: 480, protein: 30, tags: ['breakfast'],
    ingredients: [i('bacon', '3 rashers'), i('egg', '2 eggs', { count: 2 }), opt('bread', '1 slice, toasted'), opt('ketchup|hot sauce|tomato', 'on the side')],
    steps: ['Fry the bacon in a dry pan until crisp, then move to a plate.', 'Fry the eggs in the bacon fat.', 'Toast if you like. Sauce on the side.'] },
  { name: 'Beans on toast', serves: 1, minutes: 8, kcal: 380, protein: 16, tags: VG,
    ingredients: [i('bean', '1 tin baked beans'), i('bread', '2 slices'), opt('butter', 'for the toast'), opt('cheese', 'grated on top')],
    steps: ['Warm the beans in a small pan, stirring now and then.', 'Toast and butter the bread.', 'Beans over toast. Cheese on top if you are feeling it.'] },
  { name: 'Shakshuka', serves: 2, minutes: 25, kcal: 290, protein: 17, tags: V,
    ingredients: [i('egg', '4 eggs', { count: 4 }), i('tomato', '1 tin chopped'), i('onion', '1, sliced'), opt('pepper', '1, sliced'), opt('garlic', '2 cloves'), opt('oil', '1 tbsp'), opt('bread', 'to dip')],
    steps: ['Soften the onion and pepper in oil for 8 minutes.', 'Add the garlic, then the tomatoes. Season. Simmer 10 minutes until thick.', 'Make four dips in the sauce and crack an egg into each.', 'Lid on, low heat, 5–7 minutes until the whites set.', 'Serve straight from the pan with bread.'] },
  { name: 'Steak and greens', serves: 1, minutes: 20, kcal: 520, protein: 45, tags: [],
    ingredients: [i('steak|beef', '1 steak'), i('broccoli|spinach|cabbage|kale|green bean', 'a big handful'), opt('oil|butter', 'for the pan'), opt('garlic', '1 clove')],
    steps: ['Take the steak out 20 minutes early. Pat dry, salt well.', 'Get a pan smoking hot with a little oil.', 'Cook 2–3 minutes a side for medium-rare, add butter and garlic for the last minute.', 'Rest it 5 minutes on a board.', 'Meanwhile steam or blanch the greens. Slice the steak and serve.'] },
  { name: 'Steak and chips', serves: 1, minutes: 40, kcal: 720, protein: 46, tags: [],
    ingredients: [i('steak|beef', '1 steak'), i('potato', '2 potatoes', { count: 2 }), opt('oil', '2 tbsp'), opt('mustard', 'on the side')],
    steps: ['Heat the oven to 220°C.', 'Cut the potatoes into chips, toss in oil and salt, roast 30–35 minutes, turning once.', 'Season the steak and sear 2–3 minutes a side in a very hot pan.', 'Rest the steak while the chips finish.', 'Serve with mustard.'] },
  { name: 'Roast chicken and veg', serves: 2, minutes: 60, kcal: 610, protein: 48, tags: [],
    ingredients: [i('chicken|drumstick|thigh', '4 pieces'), i('potato', '3 potatoes', { count: 3 }), i('carrot|pumpkin|onion|pepper|broccoli', 'a few, chunked'), opt('oil', '2 tbsp'), opt('garlic', '3 cloves')],
    steps: ['Heat the oven to 200°C.', 'Chunk the potatoes and veg, toss in a tray with oil, salt and pepper.', 'Sit the chicken on top, skin up, seasoned.', 'Roast 45–50 minutes until the juices run clear and the potatoes are golden.', 'Rest 5 minutes, then serve.'] },
  { name: 'Chicken stir-fry', serves: 2, minutes: 25, kcal: 540, protein: 38, tags: [],
    ingredients: [i('chicken', '2 breasts or 4 thighs'), i('rice|noodle', '150g'), i('broccoli|pepper|carrot|cabbage|mushroom|onion', 'a couple of handfuls'), opt('soy sauce|hot sauce', '2 tbsp'), opt('garlic', '2 cloves'), opt('oil', '1 tbsp')],
    steps: ['Cook the rice or noodles.', 'Slice the chicken thin. Cut the veg into strips.', 'Get a wok or big pan very hot with oil. Stir-fry the chicken 5 minutes.', 'Add the veg and garlic, 3–4 minutes more. Keep it moving.', 'Splash in the soy, toss, and serve over the rice.'] },
  { name: 'Chicken and rice', serves: 2, minutes: 30, kcal: 520, protein: 36, tags: [],
    ingredients: [i('chicken', '2 breasts or 4 thighs'), i('rice', '150g'), opt('onion', '1, chopped'), opt('garlic', '2 cloves'), opt('pea|carrot|pepper', 'a handful')],
    steps: ['Brown the chicken in a pan, then set aside.', 'Soften the onion and garlic in the same pan.', 'Stir in the rice, then 350ml water and a pinch of salt.', 'Sit the chicken on top, lid on, low heat 18 minutes.', 'Stir in the veg for the last 3 minutes. Rest, fluff, serve.'] },
  { name: 'Grilled chicken salad', serves: 1, minutes: 20, kcal: 380, protein: 40, tags: [],
    ingredients: [i('chicken', '1 breast'), i('lettuce|spinach|rocket|salad', '2 handfuls'), opt('tomato', 'a few, halved'), opt('cucumber', 'a chunk'), opt('oil', 'to dress'), opt('lemon|vinegar', 'a squeeze')],
    steps: ['Flatten the chicken a little, season, and grill or pan-fry 5–6 minutes a side.', 'Rest it, then slice.', 'Toss the leaves and veg with oil, lemon and salt.', 'Chicken on top.'] },
  { name: 'Chicken wrap', serves: 1, minutes: 15, kcal: 450, protein: 35, tags: [],
    ingredients: [i('chicken', '1 breast, sliced'), i('tortilla|wrap', '2 wraps'), opt('lettuce|salad', 'a handful'), opt('cheese', 'grated'), opt('mayonnaise|hot sauce|yoghurt', 'a spoonful')],
    steps: ['Season and pan-fry the chicken strips until cooked through, 6–8 minutes.', 'Warm the wraps in a dry pan.', 'Fill with chicken, leaves, cheese and sauce.', 'Roll tight, cut in half.'] },
  { name: 'Spaghetti bolognese', serves: 3, minutes: 40, kcal: 620, protein: 34, tags: [],
    ingredients: [i('pasta', '300g'), i('beef|mince', '400g mince'), i('tomato', '1 tin chopped'), i('onion', '1, chopped'), opt('carrot', '1, diced'), opt('garlic', '2 cloves'), opt('cheese', 'to finish')],
    steps: ['Soften the onion and carrot in a little oil, 8 minutes.', 'Add the mince and garlic, break it up, and brown it all over.', 'Pour in the tomatoes, season, and simmer 20 minutes.', 'Meanwhile cook the pasta.', 'Toss the pasta through the sauce. Cheese on top.'] },
  { name: 'Pasta with tomato sauce', serves: 2, minutes: 20, kcal: 480, protein: 15, tags: VG,
    ingredients: [i('pasta', '200g'), i('tomato', '1 tin chopped'), opt('garlic', '2 cloves'), opt('onion', '1, chopped'), opt('oil', '2 tbsp'), opt('basil', 'a few leaves'), opt('cheese', 'to finish')],
    steps: ['Put the pasta on to boil in salted water.', 'Gently fry the garlic (and onion) in oil.', 'Add the tomatoes, a pinch of salt and sugar. Simmer 10 minutes.', 'Drain the pasta, keeping a splash of water. Toss it in the sauce.', 'Basil and cheese on top.'] },
  { name: 'Mac and cheese', serves: 2, minutes: 25, kcal: 640, protein: 26, tags: V,
    ingredients: [i('pasta', '200g'), i('cheese', '150g, grated'), i('milk', '400ml'), opt('butter', '30g'), opt('flour', '2 tbsp'), opt('mustard', '1 tsp')],
    steps: ['Cook the pasta until just tender. Drain.', 'Melt the butter, stir in the flour for a minute.', 'Whisk in the milk a bit at a time and simmer until thick.', 'Off the heat, stir in most of the cheese and the mustard.', 'Mix in the pasta, top with the rest of the cheese, and grill until golden.'] },
  { name: 'Pasta carbonara', serves: 2, minutes: 20, kcal: 650, protein: 30, tags: [],
    ingredients: [i('pasta', '200g'), i('egg', '2 eggs', { count: 2 }), i('bacon|ham', '100g, chopped'), i('cheese', '50g, grated'), opt('garlic', '1 clove')],
    steps: ['Cook the pasta in salted water.', 'Fry the bacon until crisp.', 'Beat the eggs with the cheese and lots of black pepper.', 'Drain the pasta, keeping a mug of water. Off the heat, toss with the bacon.', 'Pour in the egg mix and stir fast, loosening with pasta water, until glossy. It should not scramble.'] },
  { name: 'Tuna pasta', serves: 2, minutes: 15, kcal: 520, protein: 32, tags: [],
    ingredients: [i('pasta', '200g'), i('tuna', '1 tin'), opt('mayonnaise', '2 tbsp'), opt('sweetcorn|pea|tomato', 'a handful'), opt('cheese', 'grated')],
    steps: ['Cook the pasta and drain.', 'Flake the tuna into a bowl with the mayo and veg.', 'Fold through the warm pasta. Season well.', 'Cheese on top, or under the grill for a bake.'] },
  { name: 'Tuna mayo sandwich', serves: 1, minutes: 5, kcal: 410, protein: 28, tags: [],
    ingredients: [i('bread', '2 slices'), i('tuna', '1/2 tin'), opt('mayonnaise', '1 tbsp'), opt('lettuce|cucumber|sweetcorn', 'a little')],
    steps: ['Drain the tuna and mix with mayo, salt and pepper.', 'Spread onto the bread with any salad.', 'Close, cut corner to corner.'] },
  { name: 'Jacket potato with beans', serves: 1, minutes: 20, kcal: 520, protein: 21, tags: V,
    ingredients: [i('potato', '1 large potato', { count: 1 }), i('bean', '1/2 tin baked beans'), opt('cheese', 'grated'), opt('butter', 'a knob')],
    steps: ['Prick the potato and microwave 8–10 minutes, turning halfway (or oven, 200°C, an hour).', 'Crisp it in a hot oven for 10 minutes if you have time.', 'Warm the beans.', 'Split the potato, butter, beans, cheese.'] },
  { name: 'Jacket potato with tuna', serves: 1, minutes: 20, kcal: 450, protein: 30, tags: [],
    ingredients: [i('potato', '1 large potato', { count: 1 }), i('tuna', '1/2 tin'), opt('mayonnaise', '1 tbsp'), opt('sweetcorn', 'a spoonful')],
    steps: ['Microwave the pricked potato 8–10 minutes until soft.', 'Mix the tuna with mayo and sweetcorn.', 'Split the potato and pile it in.'] },
  { name: 'Sausage and mash', serves: 2, minutes: 35, kcal: 680, protein: 26, tags: [],
    ingredients: [i('sausage', '4 sausages', { count: 4 }), i('potato', '4 potatoes', { count: 4 }), opt('butter', '1 knob'), opt('milk', 'a splash'), opt('onion', '1, for gravy'), opt('pea|broccoli', 'on the side')],
    steps: ['Peel and chunk the potatoes. Boil in salted water 15–20 minutes until soft.', 'Meanwhile fry or grill the sausages, turning, about 15 minutes.', 'Drain the potatoes, mash with butter and milk. Season.', 'Slowly fry sliced onion for a quick gravy if you like.', 'Mash, sausages, onions, peas.'] },
  { name: 'Chilli con carne', serves: 4, minutes: 45, kcal: 520, protein: 36, tags: [],
    ingredients: [i('beef|mince', '500g mince'), i('bean', '1 tin kidney beans'), i('tomato', '1 tin chopped'), i('onion', '1, chopped'), opt('pepper', '1, chopped'), opt('garlic', '2 cloves'), opt('rice', 'to serve')],
    steps: ['Soften the onion and pepper in oil.', 'Add the mince and garlic, brown well. Stir in chilli powder, cumin and paprika if you have them.', 'Add the tomatoes and drained beans. Simmer 25 minutes, lid half on.', 'Season and serve with rice.'] },
  { name: 'Salmon, rice and greens', serves: 1, minutes: 25, kcal: 560, protein: 38, tags: [],
    ingredients: [i('salmon|fish', '1 fillet'), i('rice', '75g'), i('broccoli|spinach|pea|green bean', 'a handful'), opt('lemon', 'a wedge'), opt('soy sauce', 'a splash')],
    steps: ['Cook the rice.', 'Season the salmon and roast at 200°C for 12–15 minutes, or pan-fry skin side down.', 'Steam the greens for the last 4 minutes.', 'Plate up with lemon and a splash of soy.'] },
  { name: 'Fried rice', serves: 2, minutes: 15, kcal: 450, protein: 16, tags: V,
    ingredients: [i('rice', '250g cooked (day-old is best)'), i('egg', '2 eggs', { count: 2 }), i('pea|carrot|pepper|onion|sweetcorn|broccoli', 'a couple of handfuls'), opt('soy sauce', '2 tbsp'), opt('oil', '1 tbsp'), opt('ham|bacon|chicken', 'chopped')],
    steps: ['Heat oil in a wok until very hot.', 'Fry the veg 2 minutes.', 'Push it aside, scramble the eggs in the space.', 'Add the rice and toss everything together until hot and a little crisp.', 'Soy sauce, toss again, serve.'] },
  { name: 'Egg fried noodles', serves: 2, minutes: 15, kcal: 470, protein: 18, tags: V,
    ingredients: [i('noodle', '2 nests'), i('egg', '2 eggs', { count: 2 }), opt('broccoli|pepper|carrot|cabbage|onion', 'a handful, sliced'), opt('soy sauce', '2 tbsp'), opt('garlic', '1 clove')],
    steps: ['Cook the noodles, drain, rinse.', 'Stir-fry the veg and garlic in a hot pan, 3 minutes.', 'Push aside and scramble the eggs.', 'Add the noodles and soy, toss well.'] },
  { name: 'Tomato soup', serves: 2, minutes: 30, kcal: 180, protein: 5, tags: VG,
    ingredients: [i('tomato', '2 tins or 8 fresh'), i('onion', '1, chopped'), opt('garlic', '2 cloves'), opt('cream|milk', 'a swirl'), opt('bread', 'to dunk')],
    steps: ['Soften the onion and garlic in a little oil, 8 minutes.', 'Add the tomatoes and 300ml water. Season. Simmer 15 minutes.', 'Blend until smooth.', 'A swirl of cream, bread on the side.'] },
  { name: 'Vegetable soup', serves: 3, minutes: 35, kcal: 160, protein: 5, tags: VG,
    ingredients: [i('carrot', '2, chopped', { count: 2 }), i('potato', '1, chopped', { count: 1 }), i('onion', '1, chopped'), opt('leek|celery', 'chopped'), opt('pea|bean|broccoli', 'a handful')],
    steps: ['Soften the onion in oil, 5 minutes.', 'Add the carrot, potato and anything else, plus 1 litre of water or stock.', 'Simmer 20 minutes until everything is soft.', 'Blend some or all of it. Season well.'] },
  { name: 'Lentil dal', serves: 3, minutes: 35, kcal: 380, protein: 18, tags: VG,
    ingredients: [i('lentil', '200g red lentils'), i('onion', '1, chopped'), opt('tomato', '1 tin chopped'), opt('garlic', '3 cloves'), opt('rice', 'to serve'), opt('spinach', 'a handful')],
    steps: ['Soften the onion and garlic in oil. Add curry powder or cumin and turmeric if you have them.', 'Stir in the lentils, tomatoes and 700ml water.', 'Simmer 20–25 minutes, stirring, until thick and soft.', 'Wilt in the spinach. Serve with rice.'] },
  { name: 'Greek salad', serves: 2, minutes: 10, kcal: 270, protein: 10, tags: V,
    ingredients: [i('tomato', '3, chunked'), i('cucumber', '1/2, chunked'), i('feta', '100g'), opt('onion', '1/2 red, sliced'), opt('olive|oil', 'a glug'), opt('pepper', '1, sliced')],
    steps: ['Chunk the tomatoes, cucumber and pepper into a bowl.', 'Add thin onion.', 'Lay the feta on top in a slab.', 'Oil, salt, oregano if you have it.'] },
  { name: 'Tomato and mozzarella salad', serves: 1, minutes: 5, kcal: 300, protein: 18, tags: V,
    ingredients: [i('tomato', '2, sliced'), i('mozzarella', '1 ball'), opt('basil', 'a few leaves'), opt('oil', 'a drizzle')],
    steps: ['Slice the tomatoes and mozzarella.', 'Alternate them on a plate.', 'Basil, oil, salt, pepper.'] },
  { name: 'Quesadilla', serves: 1, minutes: 10, kcal: 520, protein: 24, tags: V,
    ingredients: [i('tortilla|wrap', '2 wraps'), i('cheese', '60g, grated'), opt('bean', 'a few spoonfuls'), opt('pepper|onion|sweetcorn', 'a little, chopped'), opt('chicken', 'shredded'), opt('hot sauce', 'to serve')],
    steps: ['Lay a wrap in a dry pan over medium heat.', 'Scatter the cheese and fillings, top with the second wrap.', 'Cook 2 minutes until crisp, flip, 2 more.', 'Cut into wedges. Hot sauce.'] },
  { name: 'Broccoli cheese', serves: 2, minutes: 25, kcal: 330, protein: 18, tags: V,
    ingredients: [i('broccoli', '1 head'), i('cheese', '80g, grated'), i('milk', '300ml'), opt('butter', '20g'), opt('flour', '1 tbsp')],
    steps: ['Cut the broccoli into florets and boil 4 minutes. Drain.', 'Melt the butter, stir in the flour, then whisk in the milk until thick.', 'Stir in most of the cheese.', 'Pour over the broccoli, top with the rest of the cheese and grill until bubbling.'] },
  { name: 'Apple crumble', serves: 4, minutes: 45, kcal: 350, protein: 4, tags: V,
    ingredients: [i('apple|pear', '4, chopped', { count: 4 }), i('flour', '150g'), i('butter', '80g'), i('sugar', '80g'), opt('oat', 'a handful')],
    steps: ['Heat the oven to 190°C.', 'Chop the fruit into a dish with a spoon of sugar.', 'Rub the flour and butter together to crumbs, then stir in the sugar and oats.', 'Scatter over the fruit.', 'Bake 30–35 minutes until golden and bubbling.'] },
  { name: 'Baked apple', serves: 1, minutes: 30, kcal: 190, protein: 1, tags: V,
    ingredients: [i('apple', '1 apple', { count: 1 }), opt('honey|sugar', '1 tbsp'), opt('butter', 'a little'), opt('yoghurt', 'to serve')],
    steps: ['Heat the oven to 180°C.', 'Core the apple and score round its middle.', 'Fill with honey and butter.', 'Bake 25 minutes until soft. Yoghurt on the side.'] },
]

/* ---- matching against the kitchen ------------------------------------ */

export type Match = {
  recipe: Recipe
  /** what fills each ingredient, in recipe order */
  uses: Array<{ ingredient: Ingredient; item?: Item; short?: number }>
  /** required ingredients there is none (or not enough) of */
  missing: Ingredient[]
  /** names of things in the recipe that are going off */
  usesSoon: string[]
}

const options = (need: string) => need.split('|').map(s => s.trim()).filter(Boolean)

/** The kitchen's best fit for one ingredient: something that is not out, and
 *  of those the one going off soonest. */
export function findFor(need: string, items: Item[]): Item | undefined {
  const hits = items.filter(it =>
    it.amount !== 'out' &&
    options(need).some(n => covers(it.name, n) || (it.kind ? covers(it.kind, n) : false)),
  )
  return hits.sort((a, b) => (daysLeft(a) ?? 999) - (daysLeft(b) ?? 999))[0]
}

export function match(recipe: Recipe, items: Item[]): Match {
  const uses: Match['uses'] = []
  const missing: Ingredient[] = []
  const usesSoon = new Set<string>()
  for (const ingredient of recipe.ingredients) {
    const item = findFor(ingredient.item, items)
    // an item with no count is "some", which is taken to be enough
    const short = item && ingredient.count && item.count !== undefined && item.count < ingredient.count
      ? ingredient.count - item.count
      : undefined
    uses.push({ ingredient, item, short })
    if (!ingredient.optional && (!item || short)) missing.push(ingredient)
    if (item && isGoingOff(item)) usesSoon.add(item.displayName)
  }
  return { recipe, uses, missing, usesSoon: [...usesSoon] }
}

export type Filter = 'protein' | 'light' | 'quick' | 'vegetarian' | 'vegan' | 'soon'

export const FILTERS: Array<{ id: Filter; label: string; hint: string }> = [
  { id: 'protein', label: 'High protein', hint: '25g or more a serving' },
  { id: 'light', label: 'Low calorie', hint: '400 kcal or less' },
  { id: 'quick', label: 'Quick', hint: '15 minutes or less' },
  { id: 'vegetarian', label: 'Vegetarian', hint: 'no meat or fish' },
  { id: 'vegan', label: 'Vegan', hint: 'nothing from an animal' },
  { id: 'soon', label: 'Uses food going off', hint: 'before it turns' },
]

export function passes(m: Match, filters: Filter[]): boolean {
  const r = m.recipe
  return filters.every(f =>
    f === 'protein' ? r.protein >= 25
    : f === 'light' ? r.kcal <= 400
    : f === 'quick' ? r.minutes <= 15
    : f === 'vegetarian' ? r.tags.includes('vegetarian')
    : f === 'vegan' ? r.tags.includes('vegan')
    : m.usesSoon.length > 0,
  )
}

/** Ready first, then nearly-there; inside each, food going off first, then
 *  the ones that use the most of what you have. */
export function rank(matches: Match[]): Match[] {
  const used = (m: Match) => m.uses.filter(u => u.item && !u.short).length
  return [...matches].sort((a, b) =>
    a.missing.length - b.missing.length
    || b.usesSoon.length - a.usesSoon.length
    || used(b) - used(a)
    || a.recipe.minutes - b.recipe.minutes,
  )
}

/** Every recipe the kitchen can make now, or is at most `within` things away from. */
export function cookable(items: Item[], recipes: Recipe[] = RECIPES, within = 2): Match[] {
  return rank(recipes.map(r => match(r, items)).filter(m => m.missing.length <= within))
}

/** What cooking it spends: one of each loose thing, the stated count of
 *  counted things. Optional extras are used if they are there. */
export function spending(m: Match): Array<{ id: string; count: number }> {
  const out = new Map<string, number>()
  for (const u of m.uses) {
    if (!u.item) continue
    out.set(u.item.id, Math.max(out.get(u.item.id) ?? 0, u.ingredient.count ?? 1))
  }
  return [...out].map(([id, count]) => ({ id, count }))
}

export const ingredientLabel = (need: string) => options(need).join(' or ')
