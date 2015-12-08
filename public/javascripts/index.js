var groupCount = 0;
var groupNames = [];

function addGroup(event) {
    event.preventDefault();
    var valid = true;
    // validate
    var name = $('#groupName').val();
    if (name === '' || groupNames.indexOf(name) >= 0) {
        $('#groupNameGroup').addClass('has-error');
        valid = false;
    } else {
        $('#groupNameGroup').removeClass('has-error');
    }
    var codes = $('#groupCodes').val();
    if (codes === '') {
        $('#groupCodesGroup').addClass('has-error');
        valid = false;
    } else {
        var re = /^\d\d\d\d\d(\+\d\d\d\d)?$/;
        var codeArray = codes.split(',');
        var error = false;
        $.each(codeArray, function(idx, code) {
                if (code.trim().match(re) === null) {
                    console.log('Error: ' + code + ' is not a valid input');
                    error = true;
                }
            });
        if (error) {
            $('#groupCodesGroup').addClass('has-error');
            valid = false;
        } else {
            $('#groupCodesGroup').removeClass('has-error');
        }
    }
    if (valid) {
        // remember 
        groupNames.push(name);
        // create group entry
        var group = document.createElement('div');
        var groupId = 'group' + String(++groupCount);
        group.id = groupId
        group.className = 'form-group zip-group';
        var label = document.createElement('h4');
        var text = document.createTextNode(name);
        label.appendChild(text);
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = groupId + 'Name';
        hidden.value = name;
        group.appendChild(label);
        group.appendChild(hidden);
        var content = document.createElement('p');
        var text = document.createTextNode(codes.replace(/,/g, ', '));
        content.appendChild(text);
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = groupId + 'Codes';
        hidden.value = codes;
        group.appendChild(content);
        group.appendChild(hidden);
        $('#noGroupMessage').after(group);
        // disable message
        $('#noGroupMessage').addClass('hidden');
        $('#btnRender').removeAttr('disabled');
    }
}

$(document).ready(function() {
        $("#formAdd").submit(addGroup);
    });
