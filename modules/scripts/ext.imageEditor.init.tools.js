function uniqueId(){
    return Math.random().toString(36).substr(2, 16);
}

function initTools($scope, canvas){

    $scope.tools={
        select : 'select',
        brush : 'brush',
        line : 'line',
        rectangle : 'rectangle',
        circle : 'circle',
        polygon : 'polygon',
        text : 'text',
        image : 'image'
    };

    $scope.activeTool = $scope.tools.select;
    $scope.backgroundColor = 'rgba(0,0,0,0)';
    $scope.fillColor = 'rgba(0,0,0,1)';
    $scope.strokeColor = 'rgba(255,255,255,0)';

    $scope.setActiveTool = function(tool){
        $scope.activeTool = tool;
        canvas.isDrawingMode = ($scope.activeTool == $scope.tools.brush);
    };

    $scope.getStrokeColor = function(){
        if(canvas.getActiveObject())
            return $scope.getStroke();
        else return $scope.strokeColor;

    };
    $scope.setStrokeColor = function(value){
        if(canvas.getActiveObject())
            $scope.setStroke(value);
        else $scope.strokeColor = value;

    };
    $scope.getFillColor = function(value){
        if(canvas.getActiveObject())
            return $scope.getFill(value);
        else return $scope.fillColor;

    };
    $scope.setFillColor = function(value){
        if(canvas.getActiveObject())
            $scope.setFill(value);
        else $scope.fillColor = value;

    };
    $scope.deleteSelection = function(){
        var activeObject = canvas.getActiveObject(), activeGroup = canvas.getActiveGroup();
        if (activeObject) {
            canvas.remove(activeObject);
        }
        else if (activeGroup) {
            if (confirm('Are you sure?')) {
                var objectsInGroup = activeGroup.getObjects();
                canvas.discardActiveGroup();
                objectsInGroup.forEach(function(object) {
                    canvas.remove(object);
                });
            }
        }
    };

    $scope.rasterize = function(e, filename) {
        if (!fabric.Canvas.supports('toDataURL')) {
            alert('This browser doesn\'t provide means to serialize canvas to an image');
        }
        else {
            var elem = angular.element(e.currentTarget )[0];
            elem.href = canvas.toDataURL();
            elem.download = filename;
        }
    };

    $scope.rasterizeSVG = function(e, filename) {
        var elem = angular.element(e.currentTarget )[0];
        elem.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(canvas.toSVG());
        elem.download = filename;
    };

    $scope.copy = function(){
        canvas.getActiveObject().clone(function(cloned){
            $scope._clipboard = cloned;
        })
    };

    $scope.paste = function () {
        if($scope._clipboard === undefined) return;
        $scope._clipboard.clone(function(clonedObj) {
            canvas.discardActiveObject();
            clonedObj.set({
                id: uniqueId(),
                left: clonedObj.left + 10,
                top: clonedObj.top + 10,
                evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
                // active selection needs a reference to the canvas.
                clonedObj.canvas = canvas;
                clonedObj.forEachObject(function(obj) {
                    canvas.add(obj);
                });
                // this should solve the unselectability
                clonedObj.setCoords();
            } else {
                canvas.add(clonedObj);
            }
            $scope._clipboard.top += 10;
            $scope._clipboard.left += 10;
            canvas.setActiveObject(clonedObj);
            canvas.renderAll();
        });
    };

    $scope.duplicate = function () {
        $scope.copy();
        $scope.paste();
    };

    $scope.cut = function () {
        $scope.copy();
        $scope.deleteSelection();
    };


    var obj=null, isDown=false, origX=0, origY=0;

    canvas.on('mouse:down', function(o){
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        var pointer = canvas.getPointer(o.e);
        switch($scope.activeTool) {
            case $scope.tools.line:
                obj = createLine(pointer);
                break;
            case $scope.tools.rectangle:
                obj = createRectangle(pointer);
                break;
            case $scope.tools.circle:
                obj = createCircle(pointer);
                break;
            case $scope.tools.text:
                obj = createText(pointer);
                break;
            case $scope.tools.polygon:
                //code block
                break;
            case $scope.tools.image:
                //code block
                break;

            default:
                return false;
        }
        if( obj!= null )
            canvas.add(obj);
        isDown = true;
    });


    canvas.on('mouse:move', function(o){
        if ( !isDown ) return;
        var pointer = canvas.getPointer(o.e);

        if ( obj != null ){
            switch (obj.get('type')){
                case 'rect':
                    if(origX>pointer.x)
                        obj.set({ left: Math.abs(pointer.x) });
                    if(origY>pointer.y)
                        obj.set({ top: Math.abs(pointer.y) });
                    obj.set({ width: Math.abs(origX - pointer.x) });
                    obj.set({ height: Math.abs(origY - pointer.y) });
                    break;

                case 'circle':
                    obj.set({ radius: Math.abs(origX - pointer.x) });
                    break;

                case 'line':
                    obj.set({ x2: pointer.x, y2: pointer.y });
                    break;


                default:
                    return;
            }
        }
        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o){
        if( !isDown ) return;
        if( obj != null ){
            obj.setCoords();
            $scope.activeTool = $scope.tools.select;
        }
        isDown = false;
        obj = null;
    });

    function createRectangle(pointer) {
        return new fabric.Rect({
            id: uniqueId(),
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x-origX,
            height: pointer.y-origY,
            angle: 0,
            fill: $scope.fillColor
        });
    }

    function createCircle(pointer) {
        return new fabric.Circle({
            id: uniqueId(),
            left: origX,
            top: origY,
            radius: 50,
            fill: $scope.fillColor,
            originX: 'center', originY: 'center'
        })
    }

    function createLine(pointer) {
        return new fabric.Line([pointer.x, pointer.y,pointer.x, pointer.y], {
            id: uniqueId(),
            strokeWidth: 5,
            fill: $scope.fillColor,
            stroke: $scope.strokeColor,
            originX: 'center', originY: 'center'
        });
    }

    function createText(pointer) {
        return  new fabric.Textbox('Insert your text...', {
            id: uniqueId(),
            left: origX,
            top: origY,
            fill: $scope.fillColor,
            fontFamily: 'helvetica',
            originX: 'left'
        });
    }

    $scope.toggleFullScreen = function() {
        if ((document.fullScreenElement && document.fullScreenElement !== null) ||
            (!document.mozFullScreen && !document.webkitIsFullScreen)) {
            if (document.documentElement.requestFullScreen) {
                document.documentElement.requestFullScreen();
                $scope.isFullscreen=true;
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
                $scope.isFullscreen=true;
            } else if (document.documentElement.webkitRequestFullScreen) {
                document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                $scope.isFullscreen=true;
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
                $scope.isFullscreen=false;
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
                $scope.isFullscreen=false;
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
                $scope.isFullscreen=false;
            }
        }
    }



}