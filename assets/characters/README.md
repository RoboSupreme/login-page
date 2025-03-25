# Character Animation Assets

This directory contains the sprite assets for character animations in the game.

## Directory Structure

```
/assets/characters/
  /{character_type}/   (e.g., fighter, archer, mage, support)
    /{animation_type}/ (e.g., idle, move, attack, defend, skill)
      /{direction}/    (e.g., north, east, south, west)
         sprite.png    (Individual frames or spritesheets)
```

## Character Types

- **fighter**: Melee combat characters with high health and defense
- **archer**: Ranged characters with long-distance attacks
- **mage**: Area attack characters with powerful skills
- **support**: Healing and buff characters

## Animation Types

- **idle**: Default standing animation
- **move**: Walking/movement animation
- **attack**: Basic attack animation
- **defend**: Defense stance animation (plays when being attacked from front)
- **skill**: Special ability animation

## Directions

- **north**: Character facing upward
- **east**: Character facing right
- **south**: Character facing downward
- **west**: Character facing left

## Image Specifications

- Recommended size: 64x64 pixels per frame
- Format: PNG with transparency
- Frame count: 4-8 frames per animation cycle
- Animation timing is controlled via the character's animation speed properties
