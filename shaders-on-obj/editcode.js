var code;

function initCodeMirror() {

    code = CodeMirror(document.body, {
        value: document.getElementById('fragmentShader').textContent,
        lineNumbers: true,
        matchBrackets: true,
        indentWithTabs: true,
        tabSize: 8,
        indentUnit: 8,
        mode: "text/x-glsl"
    });

    code.domElement = code.getWrapperElement();
    document.body.appendChild( code.getWrapperElement() );

    renderer.domElement.style.position = "absolute";
    code.domElement.style.position = "absolute";
    code.domElement.style.top = "65px";
    code.domElement.style.bottom = "25px";
    code.domElement.style.left = "25px";
    code.domElement.style.height = "auto";
    code.domElement.style.width = "40%";
    code.domElement.style.opacity = "0.8";
    code.refresh();

    code.on("change", function() {
        mesh.material.fragmentShader = code.getValue();
        mesh.material.needsUpdate = true;
    });

}

function createToggleableButton() {

    function isCodeVisible() {
        return code && code.getWrapperElement().style.display !== 'none';
    }

    toolbar = document.createElement( 'div' );
    toolbar.style.position = "fixed";
    toolbar.style.top = "25px";
    toolbar.style.left = "25px";
    document.body.appendChild( toolbar );

    var button = document.createElement( 'button' );
    button.textContent = "hide fragment shader";
    button.addEventListener( 'click', function( event ) {
        if ( isCodeVisible() ) {
            code.getWrapperElement().style.display = "none";
            button.textContent = "show fragment shader";
        }
        else {
            code.getWrapperElement().style.display = "";
            button.textContent = "hide code";
        }
    });
    toolbar.appendChild(button);

}