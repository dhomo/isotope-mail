package dhomo.crmmail.api.lead;

import dhomo.crmmail.api.user.User;
import dhomo.crmmail.api.exception.InvalidFieldException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Set;


@Slf4j
@RestController
@RequestMapping(path = "/api/v1/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;
    private final ModelMapper modelMapper;

    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    List<Lead> getLeads(Principal principal){
        return leadService.getAllLeads((User) principal);
    }

    @ResponseStatus(HttpStatus.OK)
    @PostMapping
    Lead postLead(@RequestBody(required = false) Lead lead, Principal principal){
        if (lead == null) lead = new Lead();
        // обнуляем владельца и id независимо от того что пришло на вход
        lead.setOwner(null);
        lead.setId(null);
        var newLead = leadService.fillDefaults(lead, (User) principal);
        return leadService.save(newLead);
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping()
    Lead putLead(@RequestBody Lead lead, Principal principal){
        if (lead.getId() == null){
            throw new InvalidFieldException("Lead id should not be null ");
        }
        var persistLead = leadService.getLead(lead.getId(), (User) principal);
        // позволяет частичное обновление (только не null поля)
        // у фронта остается возможность изменить владельца и ограничивающие роли, помним об этом
        // возможно стоит это ограничить
        modelMapper.map(lead, persistLead);
        return leadService.save(persistLead);
    }

    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{id}")
    Lead getLead(@PathVariable Long id, Principal principal){
        return leadService.getLead(id, (User) principal);
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{id}/addEmail")
    void addMessage(@PathVariable Long id,
                    @RequestParam("folderId") String  folderId,
                    @RequestParam("messageUid") Long messageUid,
                    @RequestParam(name = "roleIds", required = false) Set<Long> roleIds,
                    Principal principal){

        Lead lead = leadService.getLead(id, (User) principal);
        leadService.addEmailMessageToLead(lead, folderId, messageUid, roleIds, (User) principal);
    }

    @ResponseStatus(HttpStatus.OK)
    @PostMapping("/newWithEmail")
    void newLeadWithMessage(@RequestParam("folderId") String  folderId,
                            @RequestParam("messageUid") Long messageUid,
                            @RequestParam(name = "roleIds", required = false) Set<Long> roleIds,
                            Principal principal){
        var newLead = leadService.fillDefaults(new Lead(), (User) principal);
        leadService.addEmailMessageToLead(newLead, folderId, messageUid, roleIds, (User) principal);
    }
}
