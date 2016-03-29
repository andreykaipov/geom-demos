/**
  * @author Andrey Kaipov
  */

// For our GUI to dynamically update the material of our loaded object,
// we use the provided dat.GUI .onChange method (see the gui.js file).
// Also see: http://workshop.chromeexperiments.com/examples/gui/#7--Events
//
// Also see the source for this.
// http://threejs.org/docs/scenes/material-browser.html#MeshPhongMaterial.

// 
function updateColor( color ) {
    return function( value ) {
        if ( typeof value === "string" ) {
            value = value.replace('#', '0x');
        }
        color.setHex( value );
    }
}

// THREE.FlatShading === 1 and THREE.SmoothShading === 2;
// This just toggles between them since there's only two options.
function updateShading( material ) {
    return function( ) {
        material.shading = (material.shading === 1) ? 2 : 1;
        material.needsUpdate = true;
    }
}

// It doesn't work if I do material.side = value, but it works like this, so ¯\_(ツ)_/¯.
function updateSide( material ) {
    return function( value ) {
        if ( value == 0 ) material.side = 0;
        if ( value == 1 ) material.side = 1;
        if ( value == 2 ) material.side = 2;

        material.needsUpdate = true;
    }
}
