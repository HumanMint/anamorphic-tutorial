# Anamorphic Sim

An interactive, high-precision optical simulator for cinematography, inspired by the industrial design philosophy of Dieter Rams and the Atlas Lens Co. ecosystem.

https://humanmint.github.io/anamorphic-tutorial/

## Overview

**Anamorphic Sim** is an educational tool designed to visualize the complex relationship between camera sensor geometry and anamorphic lens optics. It allows cinematographers to see how different sensor modes (from Super 35 to 4:3 Large Format) capture light and how anamorphic desqueezing transforms that data into a cinematic widescreen format.

## Key Features

- **Absolute Physical Scaling**: Sensors are rendered on a calibrated 10mm grid, providing an accurate sense of scale across different camera systems.
- **Atlas Scope 90**: A specialized simulation of rotating the camera sensor 90 degrees while maintaining horizontal lens orientation, unlocking vertical-rich anamorphic textures.
- **Reactive Typography**: Real-time numerical feedback using Rams-inspired color coding (Red for growth, Blue for reduction).
- **High-End Motion**: Built with **anime.js v4**, utilizing precision elastic easings (`outElastic`) to simulate mechanical hardware responses.

## Tech Stack

- **React 19** + **Vite**
- **Tailwind CSS v4** (Modern CSS-first framework)
- **anime.js v4** (The latest animation engine for complex motion)
- **PapaParse** (Robust CSV handling for the Atlas camera database)

## Credits

Designed and developed by **Ha Joon Park**.
Inspired by the functionalist principles of Braun and Dieter Rams.
Data sourced from the Atlas Lens Co. camera database.

---
© 2025 Ha Joon Park
